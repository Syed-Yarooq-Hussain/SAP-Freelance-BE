'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('project_milestone', 'start_date', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'description', // optional (MySQL)
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('project_milestone', 'start_date');
  },
};
