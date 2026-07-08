"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = [
      "consultant_detail",
      "project_payment",
      "milestone_docs",
      "documents",
      "project_task",
      "project_milestone",
      "project_detail",
      "project_consultant",
      "project_industries",
      "project",
      "industries",
      "consultant_module",
      "consultants",
      "modules",
      "users",
      "meetings",
      "meeting_invitees",
    ];

    for (const table of tables) {
      try {
        const columns = await queryInterface.describeTable(table);
        if (!columns.deleted_at) {
          await queryInterface.addColumn(table, "deleted_at", {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
          });
        }
      } catch (error) {
        // Some legacy environments may not have every historical table.
        continue;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      "consultant_detail",
      "project_payment",
      "milestone_docs",
      "documents",
      "project_task",
      "project_milestone",
      "project_detail",
      "project_consultant",
      "project_industries",
      "project",
      "industries",
      "consultant_module",
      "consultants",
      "modules",
      "users",
      "meetings",
      "meeting_invitees",
    ];

    for (const table of tables) {
      try {
        const columns = await queryInterface.describeTable(table);
        if (columns.deleted_at) {
          await queryInterface.removeColumn(table, "deleted_at");
        }
      } catch (error) {
        continue;
      }
    }
  },
};
