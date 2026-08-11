'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');

    if (!table.timezone) {
      await queryInterface.addColumn('users', 'timezone', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Asia/Karachi',
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');

    if (table.timezone) {
      await queryInterface.removeColumn('users', 'timezone');
    }
  },
};
