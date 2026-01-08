'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },

        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        message: {
          type: Sequelize.TEXT,
          allowNull: false,
        },

        type: {
          type: Sequelize.STRING,
          allowNull: true,
        },

        target: {
          type: Sequelize.STRING,
          allowNull: true,
        },

        date: {
          type: Sequelize.DATE,
          allowNull: true,
        },

        action: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: true
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
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
