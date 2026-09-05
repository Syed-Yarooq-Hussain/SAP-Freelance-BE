'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE "users" SET "currency" = 'USD' WHERE "currency" IS NULL OR TRIM("currency") = ''`,
    );
    await queryInterface.changeColumn('users', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'USD',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
