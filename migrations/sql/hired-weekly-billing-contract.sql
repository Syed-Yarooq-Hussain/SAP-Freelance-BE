CREATE OR REPLACE FUNCTION milestone_working_weeks(mid bigint) RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT greatest(COALESCE(required_hours,0),0)::numeric / 40 FROM project_milestone WHERE id=mid;
$$;

CREATE FUNCTION milestone_date_hours() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND ROW(OLD.start_date,OLD.due_date) IS NOT DISTINCT FROM ROW(NEW.start_date,NEW.due_date) THEN RETURN NEW; END IF;
  IF NEW.start_date IS NOT NULL AND NEW.due_date IS NOT NULL THEN
    SELECT count(*)*8 INTO NEW.required_hours
    FROM generate_series(NEW.start_date::date::timestamp,NEW.due_date::date::timestamp,interval '1 day') d
    WHERE extract(isodow FROM d) BETWEEN 1 AND 5;
  ELSIF TG_OP='UPDATE' THEN
    NEW.required_hours:=0;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER milestone_date_hours BEFORE INSERT OR UPDATE OF start_date,due_date ON project_milestone
  FOR EACH ROW EXECUTE FUNCTION milestone_date_hours();

CREATE OR REPLACE FUNCTION milestone_weekly_billing(mid bigint) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object(
    'basis','hired_team_weeks','weeks',milestone_working_weeks(mid),
    'estimated_amount',CASE WHEN m.team_configured THEN m.team_estimated_amount ELSE
      COALESCE((SELECT sum(amount) FROM project_payment WHERE project_milestone_id=mid
        AND payment_module='milestone' AND deleted_at IS NULL),0) END,
    'payable_amount',CASE WHEN m.team_configured THEN m.team_payable_amount ELSE
      COALESCE((SELECT sum(amount) FROM project_payment WHERE project_milestone_id=mid
        AND payment_module='milestone' AND deleted_at IS NULL),0) END,
    'currency',m.team_currency,
    'historical',m.team_billing_basis<>'hired_team_weeks',
    'breakdown',COALESCE((SELECT jsonb_agg(jsonb_build_object(
      'consultant_id',a.consultant_id,'weekly_hours',COALESCE(a.weekly_hours,a.hours / NULLIF(milestone_working_weeks(mid),0),0),
      'total_hours',a.hours,'client_hourly_rate',a.client_rate,'amount',a.payable_amount,'currency',a.currency
    ) ORDER BY a.position) FROM milestone_allocation a WHERE a.milestone_id=mid AND a.candidate_status='hired'),'[]'::jsonb)
  ) FROM project_milestone m WHERE m.id=mid;
$$;

CREATE OR REPLACE FUNCTION milestone_duration_changed() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP='UPDATE' AND ROW(OLD.start_date,OLD.due_date,OLD.required_hours,OLD.deleted_at)
    IS NOT DISTINCT FROM ROW(NEW.start_date,NEW.due_date,NEW.required_hours,NEW.deleted_at) THEN RETURN NEW; END IF;
  IF NEW.start_date IS NOT NULL AND NEW.due_date IS NOT NULL AND NEW.due_date < NEW.start_date THEN
    RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Milestone end date must follow start date';
  END IF;
  IF NEW.required_hours IS NOT NULL AND (NEW.required_hours<0 OR NEW.required_hours::text IN ('NaN','Infinity','-Infinity')) THEN
    RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Milestone required hours must be finite and nonnegative';
  END IF;
  PERFORM milestone_team_sync(NEW.id);
  RETURN NEW;
END $$;
DROP TRIGGER milestone_duration_changed ON project_milestone;
CREATE TRIGGER milestone_duration_changed AFTER INSERT OR UPDATE OF start_date,due_date,required_hours,deleted_at
  ON project_milestone FOR EACH ROW EXECUTE FUNCTION milestone_duration_changed();
