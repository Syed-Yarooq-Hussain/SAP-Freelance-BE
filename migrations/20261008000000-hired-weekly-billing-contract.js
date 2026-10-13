'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      const sql = (query, replacements) => queryInterface.sequelize.query(query, { transaction, replacements });
      await sql(`CREATE TABLE milestone_billing_function_backup(name text PRIMARY KEY, definition text NOT NULL);
        INSERT INTO milestone_billing_function_backup
        SELECT name,pg_get_functiondef(to_regprocedure(name)) FROM unnest(ARRAY[
          'milestone_team_sync(bigint)','milestone_working_weeks(bigint)',
          'milestone_weekly_billing(bigint)','milestone_duration_changed()'
        ]) name;`);
      const [rows] = await sql("SELECT definition FROM milestone_billing_function_backup WHERE name='milestone_team_sync(bigint)'");
      let sync = rows[0].definition;
      const eligible = "lower(pc.status) IN ('shortlisted','interview-schedule','interviewed','offered','hired')";
      if (!sync.includes(eligible)) throw new Error('Unexpected milestone synchronizer; refusing partial update');
      sync = sync.replace(eligible, "lower(pc.status)='hired'");
      sync = sync.replace('DELETE FROM milestone_allocation WHERE milestone_id=mid;', `
        IF EXISTS(SELECT 1 FROM project_consultant WHERE project_id=pid AND deleted_at IS NULL
          AND lower(status)='hired' AND requested_hours>0 AND (decided_rate IS NULL OR decided_rate<=0)) THEN
          RAISE EXCEPTION USING ERRCODE='MT400', MESSAGE='Hired consultants need a positive agreed rate';
        END IF;
        DELETE FROM milestone_allocation WHERE milestone_id=mid;`);
      // Reuse archived unpaid identities too, including their uploaded receipts.
      sync = sync.replace("AND NOT is_paid AND deleted_at IS NULL ORDER BY id LIMIT 1 FOR UPDATE;",
        "AND NOT is_paid ORDER BY (deleted_at IS NULL) DESC,id LIMIT 1 FOR UPDATE;");
      sync = sync.replace("SET amount=payable,payment_module='milestone' WHERE id=paymentid;",
        "SET amount=payable,payment_module='milestone',deleted_at=NULL WHERE id=paymentid;");
      await sql(sync);
      await sql(fs.readFileSync(path.join(__dirname, 'sql/hired-weekly-billing-contract.sql'), 'utf8'));
      await sql(`DO $$ DECLARE item record; BEGIN
        FOR item IN SELECT id FROM project_milestone WHERE deleted_at IS NULL ORDER BY project_id,id LOOP
          PERFORM milestone_team_sync(item.id);
        END LOOP;
      END $$;`);
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      const [rows] = await queryInterface.sequelize.query('SELECT definition FROM milestone_billing_function_backup ORDER BY name', { transaction });
      for (const row of rows) await queryInterface.sequelize.query(row.definition, { transaction });
      await queryInterface.sequelize.query(`
        DROP TRIGGER milestone_date_hours ON project_milestone;
        DROP FUNCTION milestone_date_hours();
        DROP TRIGGER milestone_duration_changed ON project_milestone;
        CREATE TRIGGER milestone_duration_changed AFTER INSERT OR UPDATE OF start_date,due_date,deleted_at
          ON project_milestone FOR EACH ROW EXECUTE FUNCTION milestone_duration_changed();
        DROP TABLE milestone_billing_function_backup;
      `, { transaction });
      // Keep financial snapshots intact. Future authorized edits use the old rules.
    });
  },
};
