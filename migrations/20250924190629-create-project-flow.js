'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ Projects
    await queryInterface.createTable('projects', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      client_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'pending' },
      start_date: { type: Sequelize.DATE, allowNull: true },
      end_date: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 2️⃣ Project Consultants
    await queryInterface.createTable('project_consultants', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      consultant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      status: { type: Sequelize.STRING, defaultValue: 'shortlisted' },
      selected_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      nda_link: { type: Sequelize.TEXT, allowNull: true },
      consultant_sign: { type: Sequelize.BOOLEAN, defaultValue: false },
      contract_link: { type: Sequelize.TEXT, allowNull: true },
      client_sign: { type: Sequelize.BOOLEAN, defaultValue: false }
    });

    // 3️⃣ Consultant Interviews
    await queryInterface.createTable('consultant_interviews', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      consultant_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      interview_date: { type: Sequelize.DATEONLY, allowNull: false },
      start_time: { type: Sequelize.TIME, allowNull: false },
      end_time: { type: Sequelize.TIME, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 4️⃣ Project Summary
    await queryInterface.createTable('project_summary', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      summary: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') }
    });

    // 5️⃣ Project Scope of Work
    await queryInterface.createTable('project_scope_of_work', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: Sequelize.STRING, allowNull: false },
      detail: { type: Sequelize.TEXT, allowNull: false },
      document_url: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING, defaultValue: 'pending' }
    });

    // 6️⃣ Project Milestones
    await queryInterface.createTable('project_milestones', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: Sequelize.STRING, allowNull: false },
      expected_name: { type: Sequelize.STRING, allowNull: true },
      description: { type: Sequelize.TEXT, allowNull: true },
      owner: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      dependencies: { type: Sequelize.TEXT, allowNull: true },
      approval: { type: Sequelize.BOOLEAN, defaultValue: false },
      comments: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.STRING, defaultValue: 'pending' }
    });

    // 7️⃣ Project Responsibilities Matrix
    await queryInterface.createTable('project_responsibilities_matrix', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'projects', key: 'id' }, onDelete: 'CASCADE' },
      area: { type: Sequelize.STRING, allowNull: false },
      task: { type: Sequelize.TEXT, allowNull: false },
      responsible: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      accountable: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      consulted: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      informed: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
      status: { type: Sequelize.STRING, defaultValue: 'pending' }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_responsibilities_matrix');
    await queryInterface.dropTable('project_milestones');
    await queryInterface.dropTable('project_scope_of_work');
    await queryInterface.dropTable('project_summary');
    await queryInterface.dropTable('consultant_interviews');
    await queryInterface.dropTable('project_consultants');
    await queryInterface.dropTable('projects');
  }
};
