'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('meetings', 'project_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'project',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('meetings', 'project_id');
  }
};
