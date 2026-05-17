'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('project_documents', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      project_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'project', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      consultant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      url: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_documents');
  },
};
