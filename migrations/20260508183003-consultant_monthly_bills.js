'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('consultant_monthly_bills', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      project_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'project',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      milestone_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'project_milestone',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      month: {
        type: Sequelize.STRING(7), // "2025-06"
        allowNull: false,
      },
      hours: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      is_paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pdf_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('consultant_monthly_bills');
  },
};