'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'project',
        'team_builder_roles',
        {
          type: Sequelize.JSONB,
          allowNull: false,
          defaultValue: [],
        },
        { transaction },
      );
      await queryInterface.addColumn(
        'project',
        'team_builder_revision',
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        { transaction },
      );
      // Every writer, including interview updates and account deletion, participates.
      // The parent UPDATE acquires the same row lock as Crew Builder saves.
      await queryInterface.sequelize.query(
        `
        CREATE FUNCTION crew_member_changed() RETURNS trigger LANGUAGE plpgsql AS $$
        DECLARE pid bigint; person text; prune boolean;
        BEGIN
          IF TG_OP = 'DELETE' THEN
            pid := OLD.project_id; person := OLD.consultant_id::text; prune := true;
          ELSE
            pid := NEW.project_id; person := NEW.consultant_id::text;
            prune := NEW.deleted_at IS NOT NULL OR lower(COALESCE(NEW.status, '')) = 'rejected';
          END IF;
          IF TG_OP = 'UPDATE' AND to_jsonb(OLD) IS NOT DISTINCT FROM to_jsonb(NEW) THEN RETURN NEW; END IF;
          UPDATE project SET team_builder_revision = team_builder_revision + 1,
            team_builder_roles = CASE WHEN prune THEN COALESCE((
              SELECT jsonb_agg(jsonb_set(position, '{personIds}', COALESCE((
                SELECT jsonb_agg(member ORDER BY member_order)
                FROM jsonb_array_elements(position->'personIds') WITH ORDINALITY AS people(member, member_order)
                WHERE member #>> '{}' <> person
              ), '[]'::jsonb)) ORDER BY position_order)
              FROM jsonb_array_elements(team_builder_roles) WITH ORDINALITY AS positions(position, position_order)
            ), '[]'::jsonb) ELSE team_builder_roles END
          WHERE id = pid;
          IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
          RETURN NEW;
        END $$;
        CREATE TRIGGER crew_member_changed BEFORE INSERT OR UPDATE OR DELETE ON project_consultant
          FOR EACH ROW EXECUTE FUNCTION crew_member_changed();
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'DROP TRIGGER IF EXISTS crew_member_changed ON project_consultant; DROP FUNCTION IF EXISTS crew_member_changed();',
        { transaction },
      );
      await queryInterface.removeColumn('project', 'team_builder_revision', {
        transaction,
      });
      await queryInterface.removeColumn('project', 'team_builder_roles', {
        transaction,
      });
    });
  },
};
