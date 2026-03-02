'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // USERS table columns
    await queryInterface.addColumn('users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'phone_verified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'linkedin_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('users', 'linkedin_sso_connected', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });

    await queryInterface.addColumn('users', 'avatar', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // CONSULTANTS table columns
    await queryInterface.addColumn('consultants', 'badges', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });

    await queryInterface.addColumn('consultants', 'is_certified', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
  });

    await queryInterface.addColumn('consultants', 'certification_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    // revert USERS
    await queryInterface.removeColumn('users', 'email_verified');
    await queryInterface.removeColumn('users', 'phone_verified');
    await queryInterface.removeColumn('users', 'linkedin_url');
    await queryInterface.removeColumn('users', 'linkedin_sso_connected');
    await queryInterface.removeColumn('users', 'avatar');

    // revert CONSULTANTS
    await queryInterface.removeColumn('consultants', 'badges');
    await queryInterface.removeColumn('consultants', 'is_certified');
    await queryInterface.removeColumn('consultants', 'certification_approved_at');
  },
};