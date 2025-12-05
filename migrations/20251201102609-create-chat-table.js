"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("chat", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },

      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      project_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      message_type: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "text"
      },

      is_read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("chat");
  }
};
