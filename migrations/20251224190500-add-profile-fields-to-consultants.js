'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('consultants', 'cv_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'clients_summary', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'work_experiences', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'education', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'certification', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'languages', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE consultants
      ALTER COLUMN working_schedule
      TYPE JSONB
      USING working_schedule::jsonb;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE consultants
      ALTER COLUMN skills
      TYPE JSONB
      USING skills::jsonb;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE consultants
      ALTER COLUMN career_details
      TYPE JSONB
      USING career_details::jsonb;
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('consultants', 'cv_url');
    await queryInterface.removeColumn('consultants', 'clients_summary');
    await queryInterface.removeColumn('consultants', 'work_experiences');
    await queryInterface.removeColumn('consultants', 'education');
    await queryInterface.removeColumn('consultants', 'certification');
    await queryInterface.removeColumn('consultants', 'languages');
    await queryInterface.sequelize.query(`
      ALTER TABLE consultants
      ALTER COLUMN working_schedule
      TYPE JSON
      USING working_schedule::json;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE consultants
      ALTER COLUMN skills
      TYPE JSON
      USING skills::json;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE consultants
      ALTER COLUMN career_details
      TYPE JSON
      USING career_details::json;
    `);
  },
};
