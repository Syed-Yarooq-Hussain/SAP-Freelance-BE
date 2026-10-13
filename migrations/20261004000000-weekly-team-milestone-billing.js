'use strict';
const fs = require('fs');
const path = require('path');
const read = name => fs.readFileSync(path.join(__dirname, 'sql', name), 'utf8');

module.exports = {
  async up(queryInterface) {
    const original = read('milestone-usd-up.sql');
    const sync = original.slice(0, original.indexOf('CREATE OR REPLACE FUNCTION milestone_team_snapshot'));
    const anchor = 'IF NOT FOUND OR NOT m.team_configured OR milestone_team_locked(mid) THEN RETURN; END IF;';
    if (!sync.includes(anchor)) throw new Error('Expected milestone sync definition missing');
    const replacement = `IF NOT FOUND OR milestone_team_locked(mid) THEN RETURN; END IF;
      -- Paid consultant payouts must also stay immutable, even before client settlement.
      -- The existing synchronizer validates those against the new calculated lines.
      IF m.start_date IS NOT NULL AND m.due_date IS NOT NULL AND m.due_date < m.start_date THEN
        -- Preserve historical invalid date ranges; only new date writes are rejected.
        RETURN;
      END IF;
      IF EXISTS (SELECT 1 FROM consultant_monthly_bills WHERE milestone_id=mid AND bill_type<>'milestone') THEN
        -- Legacy billing is preserved until its existing invoices are reconciled.
        RETURN;
      END IF;
      DELETE FROM milestone_allocation WHERE milestone_id=mid;
      INSERT INTO milestone_allocation(milestone_id,consultant_id,position,hours,weekly_hours,weeks)
      SELECT mid,pc.consultant_id,row_number() OVER (ORDER BY pc.id),
        round(pc.requested_hours::numeric * milestone_working_weeks(mid),2),
        pc.requested_hours,milestone_working_weeks(mid)
      FROM project_consultant pc
      JOIN users u ON u.id=pc.consultant_id AND u.deleted_at IS NULL AND u.role=2
      JOIN consultants c ON c.user_id=u.id AND c.deleted_at IS NULL
      WHERE pc.project_id=pid AND pc.deleted_at IS NULL
        AND lower(pc.status) IN ('shortlisted','interview-schedule','interviewed','offered','hired')
        AND pc.requested_hours>0 AND milestone_working_weeks(mid)>0 AND m.deleted_at IS NULL;
      UPDATE project_milestone SET team_configured=true,team_billing_basis='hired_team_weeks',
        team_revision=team_revision+1 WHERE id=mid;
    `;
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(`
        ALTER TABLE project_milestone ADD COLUMN team_billing_basis text NOT NULL DEFAULT 'explicit';
        ALTER TABLE project_milestone ALTER COLUMN team_billing_basis SET DEFAULT 'hired_team_weeks';
        ALTER TABLE milestone_allocation ADD COLUMN weekly_hours numeric, ADD COLUMN weeks numeric;
        ${read('weekly-team-milestones.sql')}
        ${sync.replace(anchor, replacement)}
        DO $$ DECLARE item record; BEGIN
          FOR item IN SELECT id FROM project_milestone WHERE deleted_at IS NULL ORDER BY project_id,id LOOP
            PERFORM milestone_team_sync(item.id);
          END LOOP;
        END $$;
      `, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM project_milestone WHERE team_billing_basis='hired_team_weeks'
            AND milestone_team_locked(id)) THEN
            RAISE EXCEPTION 'Cannot remove the calculation history of paid weekly milestones';
          END IF;
        END $$;
        DROP TRIGGER milestone_duration_changed ON project_milestone;
        DROP FUNCTION milestone_duration_changed();
        DROP FUNCTION milestone_weekly_billing(bigint);
        ${read('milestone-usd-up.sql')}
        ${read('milestone-teams-up.sql').slice(read('milestone-teams-up.sql').indexOf('CREATE FUNCTION milestone_member_changed'), read('milestone-teams-up.sql').indexOf('CREATE TRIGGER milestone_member_changed')).replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION').replace(/\binteger\b/g,'bigint')}
        DROP FUNCTION milestone_working_weeks(bigint);
        ALTER TABLE milestone_allocation DROP COLUMN weekly_hours, DROP COLUMN weeks;
        ALTER TABLE project_milestone DROP COLUMN team_billing_basis;
      `, { transaction });
    });
  },
};
