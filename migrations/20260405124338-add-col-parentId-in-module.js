'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('modules', 'parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'modules',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', 
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('modules', 'parent_id');
  },
};