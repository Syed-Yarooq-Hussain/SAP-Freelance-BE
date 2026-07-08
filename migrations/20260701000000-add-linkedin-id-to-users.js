'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('users');
    if (!table.linkedin_id) {
      await queryInterface.addColumn('users', 'linkedin_id', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable('users');
    if (table.linkedin_id) {
      await queryInterface.removeColumn('users', 'linkedin_id');
    }
  },
};
