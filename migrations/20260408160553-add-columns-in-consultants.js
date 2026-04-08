'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('consultants', 'industries', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'professional_headline', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('consultants', 'expertise_level', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('consultants', 'industries');
    await queryInterface.removeColumn('consultants', 'professional_headline');
    await queryInterface.removeColumn('consultants', 'expertise_level');
  },
};