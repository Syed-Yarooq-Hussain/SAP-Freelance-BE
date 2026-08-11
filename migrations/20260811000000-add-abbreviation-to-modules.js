'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('modules');
    if (!table.abbreviation) {
      await queryInterface.addColumn('modules', 'abbreviation', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('modules');
    if (table.abbreviation) {
      await queryInterface.removeColumn('modules', 'abbreviation');
    }
  },
};
