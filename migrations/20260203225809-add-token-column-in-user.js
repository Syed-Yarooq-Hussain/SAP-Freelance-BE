'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'tokenMail', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'tokenMailExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('users', 'city', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn('users', 'country', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'tokenMail');
    await queryInterface.removeColumn('users', 'tokenMailExpiresAt');
  },
};
