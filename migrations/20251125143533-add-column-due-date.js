'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('project_payment');
    if (!table.due_date) {
      await queryInterface.addColumn('project_payment', 'due_date', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('project_payment');
    if (table.due_date) {
      await queryInterface.removeColumn('project_payment', 'due_date');
    }
  }
};
