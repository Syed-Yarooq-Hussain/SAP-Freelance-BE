-- Date-only, inclusive Monday-Friday duration: ten working days = two weeks.
CREATE FUNCTION milestone_working_weeks(mid bigint) RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT count(*)::numeric / 5 FROM project_milestone m
  CROSS JOIN LATERAL generate_series(m.start_date::date::timestamp,m.due_date::date::timestamp,interval '1 day') d
  WHERE m.id=mid AND extract(isodow FROM d) BETWEEN 1 AND 5;
$$;

CREATE FUNCTION milestone_weekly_billing(mid bigint) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN m.team_billing_basis='hired_team_weeks' THEN jsonb_build_object(
    'basis','hired_team_weeks','weeks',milestone_working_weeks(mid),
    'estimated_amount',m.team_estimated_amount,'payable_amount',m.team_payable_amount,
    'currency',m.team_currency,'locked',milestone_team_locked(mid),
    'breakdown',COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'consultant_id',a.consultant_id::text,'weekly_hours',a.weekly_hours,'weeks',a.weeks,
      'total_hours',a.hours,'client_hourly_rate',a.client_rate,'amount',a.payable_amount,
      'estimated_amount',a.estimated_amount,'currency',a.currency,'status',a.candidate_status
    ) ORDER BY a.position) FROM milestone_allocation a WHERE a.milestone_id=mid),'[]'::jsonb)
  ) ELSE NULL END FROM project_milestone m WHERE m.id=mid;
$$;

CREATE OR REPLACE FUNCTION milestone_member_changed() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE pid bigint; uid bigint; mid bigint; removing boolean;
BEGIN
  IF TG_OP='DELETE' THEN pid:=OLD.project_id; uid:=OLD.consultant_id; removing:=true;
  ELSE
    pid:=NEW.project_id; uid:=NEW.consultant_id;
    removing:=NEW.deleted_at IS NOT NULL OR lower(COALESCE(NEW.status,''))='rejected';
    IF TG_OP='UPDATE' AND ROW(OLD.status,OLD.decided_rate,OLD.requested_hours,OLD.deleted_at,OLD.project_id,OLD.consultant_id)
      IS NOT DISTINCT FROM ROW(NEW.status,NEW.decided_rate,NEW.requested_hours,NEW.deleted_at,NEW.project_id,NEW.consultant_id) THEN RETURN NEW; END IF;
    IF TG_OP='UPDATE' AND ROW(OLD.project_id,OLD.consultant_id) IS DISTINCT FROM ROW(NEW.project_id,NEW.consultant_id) THEN
      RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Project membership identities cannot be reassigned';
    END IF;
  END IF;
  PERFORM 1 FROM project WHERE id=pid FOR UPDATE;
  IF removing AND EXISTS (SELECT 1 FROM milestone_allocation a JOIN project_milestone m ON m.id=a.milestone_id
    WHERE m.project_id=pid AND a.consultant_id=uid AND milestone_team_locked(m.id)) THEN
    RAISE EXCEPTION USING ERRCODE='MT409', MESSAGE='Cannot remove a consultant with paid milestone allocations';
  END IF;
  -- Include new members and weekly-hours changes, not only already allocated people.
  FOR mid IN SELECT id FROM project_milestone WHERE project_id=pid AND deleted_at IS NULL ORDER BY id LOOP
    IF NOT milestone_team_locked(mid) THEN PERFORM milestone_team_sync(mid); END IF;
  END LOOP;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

CREATE FUNCTION milestone_duration_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND ROW(OLD.start_date,OLD.due_date,OLD.deleted_at)
    IS NOT DISTINCT FROM ROW(NEW.start_date,NEW.due_date,NEW.deleted_at) THEN RETURN NEW; END IF;
  IF NEW.start_date IS NOT NULL AND NEW.due_date IS NOT NULL AND NEW.due_date < NEW.start_date THEN
    RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Milestone end date must follow start date';
  END IF;
  PERFORM milestone_team_sync(NEW.id);
  RETURN NEW;
END $$;
CREATE TRIGGER milestone_duration_changed AFTER INSERT OR UPDATE OF start_date,due_date,deleted_at
  ON project_milestone FOR EACH ROW EXECUTE FUNCTION milestone_duration_changed();
