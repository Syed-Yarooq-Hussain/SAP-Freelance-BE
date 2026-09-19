CREATE OR REPLACE FUNCTION milestone_team_sync(mid bigint) RETURNS void LANGUAGE plpgsql AS $$
DECLARE m project_milestone%ROWTYPE; pid bigint; margin numeric; line record;
  rate numeric; clientrate numeric; cur text; billcurrency text := 'USD'; fx usd_exchange_rate%ROWTYPE;
  estimate numeric := 0; payable numeric := 0; paymentid bigint;
BEGIN
  SELECT project_id INTO pid FROM project_milestone WHERE id=mid;
  PERFORM 1 FROM project WHERE id=pid FOR UPDATE;
  SELECT * INTO m FROM project_milestone WHERE id=mid FOR UPDATE;
  IF NOT FOUND OR NOT m.team_configured OR milestone_team_locked(mid) THEN RETURN; END IF;
  SELECT greatest(COALESCE(u.profit_margin_percentage,0),0) INTO margin
    FROM project p JOIN users u ON u.id=p.client_id WHERE p.id=pid;
  FOR line IN
    SELECT a.*, pc.status, pc.decided_rate, c.rate AS listed_rate,
      u.currency AS user_currency, u.deleted_at AS user_deleted,
      c.deleted_at AS profile_deleted, pc.deleted_at AS member_deleted,
      pc.id AS member_id, c.id AS profile_id
    FROM milestone_allocation a
    LEFT JOIN project_consultant pc ON pc.project_id=pid AND pc.consultant_id=a.consultant_id AND pc.deleted_at IS NULL
    LEFT JOIN users u ON u.id=a.consultant_id
    LEFT JOIN consultants c ON c.user_id=a.consultant_id
    WHERE a.milestone_id=mid ORDER BY a.position
  LOOP
    IF line.member_id IS NULL OR line.profile_id IS NULL OR line.user_deleted IS NOT NULL OR line.profile_deleted IS NOT NULL
      OR lower(COALESCE(line.status,'')) NOT IN ('shortlisted','interview-schedule','interviewed','offered','hired') THEN
      RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Allocated consultant is not an eligible project member';
    END IF;
    rate := CASE WHEN line.decided_rate > 0 THEN line.decided_rate::numeric ELSE line.listed_rate::text::numeric END;
    IF rate IS NULL OR rate <= 0 OR rate::text IN ('NaN','Infinity','-Infinity') THEN
      RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Every selected consultant needs a positive hourly rate';
    END IF;
    cur := upper(COALESCE(NULLIF(trim(line.user_currency),''),'USD'));
    SELECT * INTO fx FROM usd_exchange_rate WHERE currency=cur;
    IF cur='USD' THEN
      fx.units_per_usd:=1; fx.as_of:=CURRENT_DATE; fx.source:='identity';
    ELSIF fx.currency IS NULL OR fx.fetched_at < now()-interval '7 days' OR fx.as_of < CURRENT_DATE-7 THEN
      RAISE EXCEPTION USING ERRCODE='MT503', MESSAGE='USD exchange rate unavailable or stale for ' || cur || '; retry after rates refresh';
    END IF;
    clientrate := round(rate / fx.units_per_usd * (1 + COALESCE(margin,0)/100),2);
    UPDATE milestone_allocation SET base_rate=rate, client_rate=clientrate,
      estimated_amount=round(hours*clientrate,2),
      payable_amount=CASE WHEN lower(line.status)='hired' AND line.decided_rate>0 THEN round(hours*clientrate,2) ELSE 0 END,
      payout_amount=CASE WHEN lower(line.status)='hired' AND line.decided_rate>0 THEN round(hours*line.decided_rate::numeric,2) ELSE 0 END,
      currency='USD', source_currency=cur, fx_units_per_usd=fx.units_per_usd, fx_as_of=fx.as_of, fx_source=fx.source, candidate_status=lower(line.status)
    WHERE milestone_id=mid AND consultant_id=line.consultant_id;
  END LOOP;
  SELECT COALESCE(sum(estimated_amount),0),COALESCE(sum(payable_amount),0)
    INTO estimate,payable FROM milestone_allocation WHERE milestone_id=mid;
  IF m.deleted_at IS NOT NULL THEN estimate:=0; payable:=0; END IF;

  -- Legacy/task bills must be reconciled explicitly; never delete financial history.
  IF EXISTS(SELECT 1 FROM consultant_monthly_bills WHERE milestone_id=mid AND bill_type<>'milestone') THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Reconcile existing task/monthly bills before configuring milestone billing';
  END IF;
  IF EXISTS(SELECT 1 FROM consultant_monthly_bills b LEFT JOIN milestone_allocation a
      ON a.milestone_id=b.milestone_id AND a.consultant_id=b.user_id
      WHERE b.milestone_id=mid AND b.is_paid AND (a.consultant_id IS NULL OR a.payout_amount<>b.amount::text::numeric
        OR a.hours<>b.hours::text::numeric OR COALESCE(a.source_currency,a.currency) IS DISTINCT FROM b.currency OR a.candidate_status<>'hired' OR m.deleted_at IS NOT NULL)) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Already paid consultant allocations cannot be changed';
  END IF;
  UPDATE project_milestone SET team_estimated_amount=estimate,team_payable_amount=payable,
    team_currency=COALESCE(billcurrency,'USD') WHERE id=mid;

  -- Keep the current unpaid payment identity/document when its amount changes.
  SELECT id INTO paymentid FROM project_payment WHERE project_milestone_id=mid AND payment_module='milestone' AND NOT is_paid AND deleted_at IS NULL ORDER BY id LIMIT 1 FOR UPDATE;
  IF payable=0 THEN
    UPDATE project_payment SET deleted_at=now() WHERE project_milestone_id=mid AND payment_module='milestone' AND NOT is_paid AND deleted_at IS NULL;
  ELSE
    UPDATE project_payment SET deleted_at=now() WHERE project_milestone_id=mid AND payment_module='milestone' AND NOT is_paid AND deleted_at IS NULL AND id<>paymentid;
    IF paymentid IS NULL THEN
      INSERT INTO project_payment(project_id,project_milestone_id,amount,payment_module,is_paid)
        VALUES(pid,mid,payable,'milestone',false);
    ELSE
      UPDATE project_payment SET amount=payable,payment_module='milestone' WHERE id=paymentid;
    END IF;
  END IF;

  DELETE FROM consultant_monthly_bills b WHERE b.milestone_id=mid AND b.bill_type='milestone' AND NOT b.is_paid
    AND (m.deleted_at IS NOT NULL OR NOT EXISTS(SELECT 1 FROM milestone_allocation a
      WHERE a.milestone_id=mid AND a.consultant_id=b.user_id AND a.payout_amount>0));
  IF m.deleted_at IS NULL THEN
    INSERT INTO consultant_monthly_bills(project_id,user_id,milestone_id,month,hours,amount,is_paid,bill_type,currency)
      SELECT pid,consultant_id,mid,to_char(COALESCE(m.due_date,CURRENT_DATE),'YYYY-MM'),hours,payout_amount,false,'milestone',COALESCE(source_currency,currency)
      FROM milestone_allocation WHERE milestone_id=mid AND payout_amount>0
      ON CONFLICT (milestone_id,user_id) WHERE bill_type='milestone'
      DO UPDATE SET hours=EXCLUDED.hours,amount=EXCLUDED.amount,month=EXCLUDED.month,currency=EXCLUDED.currency
      WHERE NOT consultant_monthly_bills.is_paid;
  END IF;
  PERFORM milestone_project_totals(pid);
END $$;

CREATE OR REPLACE FUNCTION milestone_team_snapshot(mid bigint) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('revision',m.team_revision,'configured',m.team_configured,
    'locked',milestone_team_locked(mid),'estimated_amount',m.team_estimated_amount,
    'payable_amount',m.team_payable_amount,'currency',m.team_currency,
    'allocations',COALESCE((SELECT jsonb_agg(jsonb_build_object('consultant_id',consultant_id::text,'hours',hours) ORDER BY position)
      FROM milestone_allocation WHERE milestone_id=mid),'[]'::jsonb),
    'breakdown',COALESCE((SELECT jsonb_agg(jsonb_build_object('consultant_id',consultant_id::text,'hours',hours,
      'hourly_rate',client_rate,'status',candidate_status,'estimated_amount',estimated_amount,'payable_amount',payable_amount,'currency',currency, 'source_currency',COALESCE(source_currency,currency), 'fx_units_per_usd',fx_units_per_usd,'fx_as_of',fx_as_of,'fx_source',fx_source) ORDER BY position)
      FROM milestone_allocation WHERE milestone_id=mid),'[]'::jsonb))
  FROM project_milestone m WHERE m.id=mid;
$$;

CREATE OR REPLACE FUNCTION milestone_bill_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m project_milestone%ROWTYPE; a milestone_allocation%ROWTYPE; mid bigint; pid bigint;
BEGIN
  IF TG_OP='DELETE' THEN mid:=OLD.milestone_id; ELSE mid:=NEW.milestone_id; END IF;
  SELECT project_id INTO pid FROM project_milestone WHERE id=mid;
  PERFORM 1 FROM project WHERE id=pid FOR UPDATE;
  SELECT * INTO m FROM project_milestone WHERE id=mid FOR UPDATE;
  IF TG_OP<>'INSERT' AND OLD.is_paid AND (TG_OP='DELETE' OR to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW)) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Paid consultant bills are immutable';
  END IF;
  IF TG_OP='UPDATE' AND ROW(OLD.project_id,OLD.milestone_id,OLD.user_id,OLD.bill_type) IS DISTINCT FROM ROW(NEW.project_id,NEW.milestone_id,NEW.user_id,NEW.bill_type) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Consultant bill ownership cannot be changed';
  END IF;
  IF TG_OP<>'DELETE' AND m.team_configured THEN
    SELECT * INTO a FROM milestone_allocation WHERE milestone_id=mid AND consultant_id=NEW.user_id;
    IF NEW.bill_type<>'milestone' OR a.consultant_id IS NULL OR a.payout_amount<=0
      OR NEW.amount::text::numeric<>a.payout_amount OR NEW.hours::text::numeric<>a.hours OR NEW.project_id<>pid OR NEW.currency IS DISTINCT FROM COALESCE(a.source_currency,a.currency) THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Saved milestone allocations already control consultant billing; task/monthly billing would duplicate payment';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
