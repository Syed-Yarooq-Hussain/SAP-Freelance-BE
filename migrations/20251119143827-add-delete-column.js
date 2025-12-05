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
      "chat",
    ];

    for (const table of tables) {
      await queryInterface.addColumn(table, "deleted_at", {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
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
      "chat",
    ];

    for (const table of tables) {
      await queryInterface.removeColumn(table, "deleted_at");
    }
  },
};
