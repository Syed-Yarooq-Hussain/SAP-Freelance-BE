'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('module_requests', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      is_accepted: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX module_requests_pending_user_name_unique
      ON module_requests (user_id, LOWER(name))
      WHERE is_accepted IS NULL
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('module_requests');
  },
};
