-- Existing milestones remain unconfigured. No existing financial row is changed.
ALTER TABLE project_milestone
  ADD COLUMN team_revision integer NOT NULL DEFAULT 0 CHECK (team_revision >= 0),
  ADD COLUMN team_configured boolean NOT NULL DEFAULT false,
  ADD COLUMN team_estimated_amount numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN team_payable_amount numeric(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN team_currency varchar(3) NOT NULL DEFAULT 'USD';
ALTER TABLE project_milestone ALTER COLUMN team_configured SET DEFAULT true;
ALTER TABLE project_payment ALTER COLUMN amount TYPE numeric(18,2);
ALTER TABLE consultant_monthly_bills ADD COLUMN currency varchar(3);

CREATE TABLE milestone_allocation (
  milestone_id integer NOT NULL REFERENCES project_milestone(id) ON DELETE RESTRICT,
  consultant_id integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  position integer NOT NULL,
  hours numeric(8,2) NOT NULL CHECK (hours > 0 AND hours <= 100000),
  base_rate numeric NOT NULL DEFAULT 0,
  client_rate numeric NOT NULL DEFAULT 0,
  estimated_amount numeric(18,2) NOT NULL DEFAULT 0,
  payable_amount numeric(18,2) NOT NULL DEFAULT 0,
  payout_amount numeric(18,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  candidate_status text NOT NULL DEFAULT '',
  PRIMARY KEY (milestone_id, consultant_id)
);
CREATE INDEX milestone_allocation_consultant ON milestone_allocation(consultant_id);
CREATE UNIQUE INDEX milestone_payout_once ON consultant_monthly_bills(milestone_id,user_id)
  WHERE bill_type = 'milestone';

CREATE FUNCTION milestone_team_locked(mid integer) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS(SELECT 1 FROM project_payment WHERE project_milestone_id=mid AND is_paid);
$$;

CREATE FUNCTION milestone_project_totals(pid integer) RETURNS void LANGUAGE sql AS $$
  UPDATE project_detail SET
    cost = COALESCE((SELECT sum(amount) FROM project_payment WHERE project_id=pid AND deleted_at IS NULL),0),
    paid_amount = COALESCE((SELECT sum(amount) FROM project_payment WHERE project_id=pid AND is_paid AND deleted_at IS NULL),0)
  WHERE project_id=pid AND deleted_at IS NULL;
$$;

-- Shared by API writes and every pricing/membership writer. NUMERIC arithmetic
-- rounds the client hourly rate once, then each line to cents before summing.
CREATE FUNCTION milestone_team_sync(mid integer) RETURNS void LANGUAGE plpgsql AS $$
DECLARE m project_milestone%ROWTYPE; pid integer; margin numeric; line record;
  rate numeric; clientrate numeric; cur text; billcurrency text;
  estimate numeric := 0; payable numeric := 0; paymentid integer;
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
    IF cur !~ '^[A-Z]{3}$' OR (billcurrency IS NOT NULL AND cur <> billcurrency) THEN
      RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Milestone allocations must use one valid currency';
    END IF;
    billcurrency := cur;
    clientrate := round(rate * (1 + COALESCE(margin,0)/100),2);
    UPDATE milestone_allocation SET base_rate=rate, client_rate=clientrate,
      estimated_amount=round(hours*clientrate,2),
      payable_amount=CASE WHEN lower(line.status)='hired' AND line.decided_rate>0 THEN round(hours*clientrate,2) ELSE 0 END,
      payout_amount=CASE WHEN lower(line.status)='hired' AND line.decided_rate>0 THEN round(hours*line.decided_rate::numeric,2) ELSE 0 END,
      currency=cur, candidate_status=lower(line.status)
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
        OR a.hours<>b.hours::text::numeric OR a.currency IS DISTINCT FROM b.currency OR a.candidate_status<>'hired' OR m.deleted_at IS NOT NULL)) THEN
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
      SELECT pid,consultant_id,mid,to_char(COALESCE(m.due_date,CURRENT_DATE),'YYYY-MM'),hours,payout_amount,false,'milestone',currency
      FROM milestone_allocation WHERE milestone_id=mid AND payout_amount>0
      ON CONFLICT (milestone_id,user_id) WHERE bill_type='milestone'
      DO UPDATE SET hours=EXCLUDED.hours,amount=EXCLUDED.amount,month=EXCLUDED.month,currency=EXCLUDED.currency
      WHERE NOT consultant_monthly_bills.is_paid;
  END IF;
  PERFORM milestone_project_totals(pid);
END $$;

CREATE FUNCTION milestone_team_snapshot(mid integer) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('revision',m.team_revision,'configured',m.team_configured,
    'locked',milestone_team_locked(mid),'estimated_amount',m.team_estimated_amount,
    'payable_amount',m.team_payable_amount,'currency',m.team_currency,
    'allocations',COALESCE((SELECT jsonb_agg(jsonb_build_object('consultant_id',consultant_id::text,'hours',hours) ORDER BY position)
      FROM milestone_allocation WHERE milestone_id=mid),'[]'::jsonb),
    'breakdown',COALESCE((SELECT jsonb_agg(jsonb_build_object('consultant_id',consultant_id::text,'hours',hours,
      'hourly_rate',client_rate,'status',candidate_status,'estimated_amount',estimated_amount,'payable_amount',payable_amount,'currency',currency) ORDER BY position)
      FROM milestone_allocation WHERE milestone_id=mid),'[]'::jsonb))
  FROM project_milestone m WHERE m.id=mid;
$$;

CREATE FUNCTION milestone_member_changed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pid integer; uid integer; mid integer; removing boolean;
BEGIN
  IF TG_OP='DELETE' THEN pid:=OLD.project_id; uid:=OLD.consultant_id; removing:=true;
  ELSE
    pid:=NEW.project_id; uid:=NEW.consultant_id;
    removing:=NEW.deleted_at IS NOT NULL OR lower(COALESCE(NEW.status,''))='rejected';
    IF TG_OP='UPDATE' AND ROW(OLD.status,OLD.decided_rate,OLD.deleted_at,OLD.project_id,OLD.consultant_id)
      IS NOT DISTINCT FROM ROW(NEW.status,NEW.decided_rate,NEW.deleted_at,NEW.project_id,NEW.consultant_id) THEN RETURN NEW; END IF;
    IF TG_OP='UPDATE' AND ROW(OLD.project_id,OLD.consultant_id) IS DISTINCT FROM ROW(NEW.project_id,NEW.consultant_id) THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Project membership identities cannot be reassigned';
    END IF;
  END IF;
  PERFORM 1 FROM project WHERE id=pid FOR UPDATE;
  FOR mid IN SELECT m.id FROM project_milestone m JOIN milestone_allocation a ON a.milestone_id=m.id
      WHERE m.project_id=pid AND a.consultant_id=uid ORDER BY m.id LOOP
    IF milestone_team_locked(mid) THEN
      IF removing THEN RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Cannot remove a consultant with paid milestone allocations'; END IF;
    ELSE
      IF removing THEN DELETE FROM milestone_allocation WHERE milestone_id=mid AND consultant_id=uid; END IF;
      UPDATE project_milestone SET team_revision=team_revision+1 WHERE id=mid;
      PERFORM milestone_team_sync(mid);
    END IF;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER milestone_member_changed AFTER INSERT OR UPDATE OR DELETE ON project_consultant
  FOR EACH ROW EXECUTE FUNCTION milestone_member_changed();

CREATE FUNCTION milestone_pricing_changed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE mid integer; pid integer; uid integer;
BEGIN
  IF TG_TABLE_NAME='project' THEN
    IF OLD.client_id IS NOT DISTINCT FROM NEW.client_id THEN RETURN NEW; END IF;
    pid:=NEW.id;
  ELSIF TG_TABLE_NAME='users' THEN
    IF ROW(OLD.currency,OLD.profit_margin_percentage,OLD.deleted_at) IS NOT DISTINCT FROM ROW(NEW.currency,NEW.profit_margin_percentage,NEW.deleted_at) THEN RETURN NEW; END IF;
    uid:=NEW.id;
  ELSE
    IF ROW(OLD.rate,OLD.deleted_at) IS NOT DISTINCT FROM ROW(NEW.rate,NEW.deleted_at) THEN RETURN NEW; END IF;
    uid:=NEW.user_id;
  END IF;
  IF uid IS NOT NULL AND NEW.deleted_at IS NOT NULL AND EXISTS(
    SELECT 1 FROM milestone_allocation WHERE consultant_id=uid AND milestone_team_locked(milestone_id)
  ) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Cannot delete a consultant with paid milestone allocations';
  END IF;
  FOR mid IN SELECT DISTINCT m.id FROM project_milestone m JOIN project p ON p.id=m.project_id
    LEFT JOIN milestone_allocation a ON a.milestone_id=m.id
    WHERE m.team_configured AND m.deleted_at IS NULL
      AND ((pid IS NOT NULL AND p.id=pid) OR (uid IS NOT NULL AND (p.client_id=uid OR a.consultant_id=uid))) ORDER BY m.id LOOP
    PERFORM 1 FROM project WHERE id=(SELECT project_id FROM project_milestone WHERE id=mid) FOR UPDATE;
    IF NOT milestone_team_locked(mid) THEN
      UPDATE project_milestone SET team_revision=team_revision+1 WHERE id=mid;
      PERFORM milestone_team_sync(mid);
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER milestone_client_changed AFTER UPDATE OF client_id ON project FOR EACH ROW EXECUTE FUNCTION milestone_pricing_changed();
CREATE TRIGGER milestone_user_pricing_changed AFTER UPDATE OF currency,profit_margin_percentage,deleted_at ON users FOR EACH ROW EXECUTE FUNCTION milestone_pricing_changed();
CREATE TRIGGER milestone_rate_changed AFTER UPDATE OF rate,deleted_at ON consultants FOR EACH ROW EXECUTE FUNCTION milestone_pricing_changed();

-- Serializes settlement with team saves; guards all payment entry points.
CREATE FUNCTION milestone_payment_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m project_milestone%ROWTYPE; mid integer; pid integer;
BEGIN
  IF TG_OP='DELETE' THEN mid:=OLD.project_milestone_id; ELSE mid:=NEW.project_milestone_id; END IF;
  SELECT project_id INTO pid FROM project_milestone WHERE id=mid;
  PERFORM 1 FROM project WHERE id=pid FOR UPDATE;
  SELECT * INTO m FROM project_milestone WHERE id=mid FOR UPDATE;
  IF TG_OP<>'INSERT' AND OLD.is_paid THEN
    IF TG_OP='DELETE' OR to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Paid payment records are immutable';
    END IF;
  END IF;
  IF TG_OP='UPDATE' AND ROW(OLD.project_id,OLD.project_milestone_id) IS DISTINCT FROM ROW(NEW.project_id,NEW.project_milestone_id) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Payment ownership cannot be changed';
  END IF;
  IF TG_OP='UPDATE' AND m.team_configured AND OLD.payment_module IS DISTINCT FROM NEW.payment_module THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Configured milestone payment type cannot be changed';
  END IF;
  IF TG_OP<>'DELETE' AND NEW.deleted_at IS NULL AND m.team_configured AND NEW.payment_module='milestone' THEN
    IF NEW.project_id<>pid OR NEW.amount<>m.team_payable_amount OR NEW.amount<=0 OR NEW.payment_module<>'milestone' THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Milestone payment amount is controlled by saved hired allocations';
    END IF;
    IF EXISTS(SELECT 1 FROM project_payment WHERE project_milestone_id=mid AND payment_module='milestone' AND deleted_at IS NULL AND id<>NEW.id) THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='A milestone has only one active payment';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER milestone_payment_guard BEFORE INSERT OR UPDATE OR DELETE ON project_payment FOR EACH ROW EXECUTE FUNCTION milestone_payment_guard();

CREATE FUNCTION milestone_payment_totals() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='DELETE' THEN PERFORM milestone_project_totals(OLD.project_id); RETURN OLD; END IF;
  PERFORM milestone_project_totals(NEW.project_id); RETURN NEW;
END $$;
CREATE TRIGGER milestone_payment_totals AFTER INSERT OR UPDATE OR DELETE ON project_payment FOR EACH ROW EXECUTE FUNCTION milestone_payment_totals();

CREATE FUNCTION milestone_bill_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE m project_milestone%ROWTYPE; a milestone_allocation%ROWTYPE; mid integer; pid integer;
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
      OR NEW.amount::text::numeric<>a.payout_amount OR NEW.hours::text::numeric<>a.hours OR NEW.project_id<>pid OR NEW.currency IS DISTINCT FROM a.currency THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Saved milestone allocations already control consultant billing; task/monthly billing would duplicate payment';
    END IF;
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER milestone_bill_guard BEFORE INSERT OR UPDATE OR DELETE ON consultant_monthly_bills FOR EACH ROW EXECUTE FUNCTION milestone_bill_guard();

CREATE FUNCTION milestone_record_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM 1 FROM project WHERE id=OLD.project_id FOR UPDATE;
  IF milestone_team_locked(OLD.id) AND (TG_OP='DELETE' OR to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW)) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Paid milestones are immutable';
  END IF;
  IF TG_OP='UPDATE' AND NEW.project_id<>OLD.project_id THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Milestones cannot be moved between projects';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER milestone_record_guard BEFORE UPDATE OR DELETE ON project_milestone FOR EACH ROW EXECUTE FUNCTION milestone_record_guard();

CREATE FUNCTION milestone_allocation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE mid integer; pid integer;
BEGIN
  IF TG_OP='DELETE' THEN mid:=OLD.milestone_id; ELSE mid:=NEW.milestone_id; END IF;
  SELECT project_id INTO pid FROM project_milestone WHERE id=mid;
  PERFORM 1 FROM project WHERE id=pid FOR UPDATE;
  PERFORM 1 FROM project_milestone WHERE id=mid FOR UPDATE;
  IF milestone_team_locked(mid) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Paid milestone allocations are immutable';
  END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER milestone_allocation_guard BEFORE INSERT OR UPDATE OR DELETE ON milestone_allocation
  FOR EACH ROW EXECUTE FUNCTION milestone_allocation_guard();
