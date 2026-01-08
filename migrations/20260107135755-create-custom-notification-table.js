'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('custom_notification', {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },

        notification_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },

        user_id: {
          type: Sequelize.BIGINT,
          allowNull: false,
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
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('custom_notification');
  },
};
