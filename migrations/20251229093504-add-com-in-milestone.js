'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('project_milestone');

    if (table.end_date && !table.due_date) {
      await queryInterface.renameColumn('project_milestone', 'end_date', 'due_date');
    } else if (!table.due_date) {
      await queryInterface.addColumn('project_milestone', 'due_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    const tableAfterDueDate = await queryInterface.describeTable('project_milestone');
    if (!tableAfterDueDate.start_date) {
      await queryInterface.addColumn('project_milestone', 'start_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('project_milestone');
    if (table.start_date) {
      await queryInterface.removeColumn('project_milestone', 'start_date');
    }
    if (table.due_date && !table.end_date) {
      await queryInterface.renameColumn('project_milestone', 'due_date', 'end_date');
    }
  },
};
