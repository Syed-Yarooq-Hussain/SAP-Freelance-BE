'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('consultant_monthly_bills', 'task_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'project_task',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('consultant_monthly_bills', 'log_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('consultant_monthly_bills', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addColumn('consultant_monthly_bills', 'bill_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'auto',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('consultant_monthly_bills', 'bill_type');
    await queryInterface.removeColumn('consultant_monthly_bills', 'description');
    await queryInterface.removeColumn('consultant_monthly_bills', 'log_date');
    await queryInterface.removeColumn('consultant_monthly_bills', 'task_id');
  },
};
