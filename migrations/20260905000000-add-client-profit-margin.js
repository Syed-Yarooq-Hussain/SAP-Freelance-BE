'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('users');
    if (!columns.profit_margin_percentage) {
      await queryInterface.addColumn('users', 'profit_margin_percentage', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      });

    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('users');
    if (columns.profit_margin_percentage) {
      await queryInterface.removeColumn('users', 'profit_margin_percentage');
    }
  },
};
