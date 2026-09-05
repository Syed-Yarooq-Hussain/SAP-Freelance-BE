'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('project');

    if (!columns.created_by) {
      await queryInterface.addColumn('project', 'created_by', {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }

    if (!columns.created_on_behalf) {
      await queryInterface.addColumn('project', 'created_on_behalf', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('project');
    if (columns.created_on_behalf) {
      await queryInterface.removeColumn('project', 'created_on_behalf');
    }
    if (columns.created_by) {
      await queryInterface.removeColumn('project', 'created_by');
    }
  },
};
