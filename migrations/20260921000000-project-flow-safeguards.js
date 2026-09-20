'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(`
        ALTER TABLE project_consultant ALTER COLUMN decided_rate TYPE numeric(18,2)
          USING decided_rate::numeric(18,2);
        CREATE TABLE consultant_hour_log (
          id bigserial PRIMARY KEY,
          project_id bigint NOT NULL REFERENCES project(id),
          user_id bigint NOT NULL REFERENCES users(id),
          milestone_id bigint NOT NULL REFERENCES project_milestone(id),
          task_id bigint,
          log_date date NOT NULL,
          description text,
          hours numeric(8,2) NOT NULL CHECK (hours > 0 AND hours <= 100000),
          created_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE INDEX consultant_hour_log_user_date ON consultant_hour_log(user_id, log_date DESC);
      `, { transaction });
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          IF EXISTS (SELECT 1 FROM consultant_hour_log) THEN
            RAISE EXCEPTION 'Export and reconcile hour logs before reverting; rollback would delete recorded hours';
          END IF;
          IF EXISTS (SELECT 1 FROM project_consultant WHERE decided_rate <> trunc(decided_rate)
            OR decided_rate > 2147483647 OR decided_rate < -2147483648) THEN
            RAISE EXCEPTION 'Reconcile decimal rates before reverting to integer rates';
          END IF;
        END $$;
        DROP TABLE consultant_hour_log;
        ALTER TABLE project_consultant ALTER COLUMN decided_rate TYPE integer USING decided_rate::integer;
      `, { transaction });
    });
  },
};
