DROP TRIGGER milestone_allocation_guard ON milestone_allocation;
DROP FUNCTION milestone_allocation_guard();
DROP TRIGGER milestone_record_guard ON project_milestone;
DROP TRIGGER milestone_bill_guard ON consultant_monthly_bills;
DROP TRIGGER milestone_payment_totals ON project_payment;
DROP TRIGGER milestone_payment_guard ON project_payment;
DROP TRIGGER milestone_rate_changed ON consultants;
DROP TRIGGER milestone_user_pricing_changed ON users;
DROP TRIGGER milestone_client_changed ON project;
DROP TRIGGER milestone_member_changed ON project_consultant;
DROP FUNCTION milestone_record_guard();
DROP FUNCTION milestone_bill_guard();
DROP FUNCTION milestone_payment_totals();
DROP FUNCTION milestone_payment_guard();
DROP FUNCTION milestone_pricing_changed();
DROP FUNCTION milestone_member_changed();
DROP FUNCTION milestone_team_snapshot(integer);
DROP FUNCTION milestone_team_sync(integer);
DROP FUNCTION milestone_project_totals(integer);
DROP FUNCTION milestone_team_locked(integer);
DROP INDEX milestone_payout_once;
DROP TABLE milestone_allocation;
ALTER TABLE project_milestone DROP COLUMN team_revision, DROP COLUMN team_configured,
  DROP COLUMN team_estimated_amount, DROP COLUMN team_payable_amount, DROP COLUMN team_currency;
ALTER TABLE project_payment ALTER COLUMN amount TYPE numeric(10,2);
ALTER TABLE consultant_monthly_bills DROP COLUMN currency;
-- Financial records survive rollback; do not roll back a live billing feature
-- without first reconciling its payments and consultant bills.
