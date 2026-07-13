'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('project_task');
    if (!table.due_date) {
      await queryInterface.addColumn('project_task', 'due_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('project_task');
    if (table.due_date) {
      await queryInterface.removeColumn('project_task', 'due_date');
    }
  },
};
