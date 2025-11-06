'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // === MEETINGS TABLE ===
    await queryInterface.createTable('meetings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date_time: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Pending',
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // === MEETING INVITEES TABLE ===
    await queryInterface.createTable('meeting_invitees', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      meeting_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'meetings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('meeting_invitees');
    await queryInterface.dropTable('meetings');
  },
};
