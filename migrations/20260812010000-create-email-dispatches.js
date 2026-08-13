'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_dispatches', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      provider_message_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sent_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      sent_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('email_dispatches', ['email']);
    await queryInterface.addIndex('email_dispatches', ['email_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('email_dispatches');
  },
};
