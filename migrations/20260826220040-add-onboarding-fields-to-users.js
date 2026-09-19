// migrations/XXXXXXXXXXXXXX-add-onboarding-fields-to-users.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'onboarding_status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'not_started', // 'not_started' | 'in_progress' | 'completed'
    });

    await queryInterface.addColumn('users', 'onboarding_step', {
      type: Sequelize.STRING,
      allowNull: true, // 'welcome' | 'dashboard' | 'profile' | 'calendar' | 'my_profile'
      defaultValue: null,
    });

    await queryInterface.addColumn('users', 'onboarding_started_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('users', 'onboarding_completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });

    // Separate, extensible store for contextual/feature tours (e.g. autofill_resume)
    await queryInterface.addColumn('users', 'feature_tours', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'onboarding_status');
    await queryInterface.removeColumn('users', 'onboarding_step');
    await queryInterface.removeColumn('users', 'onboarding_started_at');
    await queryInterface.removeColumn('users', 'onboarding_completed_at');
    await queryInterface.removeColumn('users', 'feature_tours');
  },
};