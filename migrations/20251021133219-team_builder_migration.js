'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 2️⃣ Modules
    await queryInterface.createTable('modules', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING },
      parent_id: { type: Sequelize.INTEGER }
    });

    // 3️⃣ Consultants
    await queryInterface.createTable('consultants', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      module_id: { type: Sequelize.INTEGER, references: { model: 'modules', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      level_id: { type: Sequelize.INTEGER },
      experience: { type: Sequelize.INTEGER },
      rate: { type: Sequelize.INTEGER },
      weekly_available_hours: { type: Sequelize.INTEGER },
      user_id: { type: Sequelize.BIGINT, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      working_schedule: { type: Sequelize.JSON },
      skills: { type: Sequelize.JSON },
      career_details: { type: Sequelize.JSON }
    });

    // 4️⃣ Consultant_Module
    await queryInterface.createTable('consultant_module', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      consultant_id: { type: Sequelize.BIGINT, references: { model: 'consultants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      module_id: { type: Sequelize.BIGINT, references: { model: 'modules', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      is_primary: { type: Sequelize.BOOLEAN }
    });

    // 5️⃣ Industries
    await queryInterface.createTable('industries', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING }
    });

    // 6️⃣ Project
    await queryInterface.createTable('project', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING },
      client_id: { type: Sequelize.BIGINT, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      company_name: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING }
    });

    // 7️⃣ Project_Industries
    await queryInterface.createTable('project_industries', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.BIGINT, references: { model: 'project', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      industry_id: { type: Sequelize.BIGINT, references: { model: 'industries', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    });

    // 8️⃣ Project_Consultant
    await queryInterface.createTable('project_consultant', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      consultant_id: { type: Sequelize.BIGINT, references: { model: 'consultants', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      project_id: { type: Sequelize.BIGINT, references: { model: 'project', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      status: { type: Sequelize.STRING },
      decided_rate: { type: Sequelize.INTEGER },
      booking_schedule: { type: Sequelize.JSON },
      is_joic_signed: { type: Sequelize.BOOLEAN },
      requested_hours: { type: Sequelize.INTEGER }
    });

    // 9️⃣ Project_Detail
    await queryInterface.createTable('project_detail', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      start_date: { type: Sequelize.DATE },
      end_date: { type: Sequelize.DATE },
      duration: { type: Sequelize.STRING },
      cost: { type: Sequelize.INTEGER },
      paid_amount: { type: Sequelize.INTEGER },
      project_id: { type: Sequelize.BIGINT, references: { model: 'project', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    });

    // 🔟 Project_Milestone
    await queryInterface.createTable('project_milestone', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      due_date: { type: Sequelize.DATE },
      end_date: { type: Sequelize.DATE },
      description: { type: Sequelize.TEXT },
      status: { type: Sequelize.STRING },
      project_id: { type: Sequelize.BIGINT, references: { model: 'project', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      required_hours: { type: Sequelize.INTEGER }
    });

    // 1️⃣1️⃣ Project_Task
    await queryInterface.createTable('project_task', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      new_column: { type: Sequelize.STRING },
      assignee_id: { type: Sequelize.BIGINT, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      project_milestone_id: { type: Sequelize.BIGINT, references: { model: 'project_milestone', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      project_id: { type: Sequelize.BIGINT, references: { model: 'project', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      required_hours: { type: Sequelize.INTEGER }
    });

    // 1️⃣2️⃣ Documents
    await queryInterface.createTable('documents', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      url: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING }
    });

    // 1️⃣3️⃣ Milestone_Docs
    await queryInterface.createTable('milestone_docs', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      doc_id: { type: Sequelize.BIGINT, references: { model: 'documents', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      project_milestone_id: { type: Sequelize.BIGINT, references: { model: 'project_milestone', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    });

    // 1️⃣4️⃣ Project_Payment
    await queryInterface.createTable('project_payment', {
      id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
      project_id: { type: Sequelize.BIGINT, references: { model: 'project', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      project_milestone_id: { type: Sequelize.BIGINT, references: { model: 'project_milestone', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' },
      amount: { type: Sequelize.INTEGER },
      payment_module: { type: Sequelize.STRING },
      is_paid: { type: Sequelize.BOOLEAN },
      doc_id: { type: Sequelize.BIGINT, references: { model: 'documents', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('project_payment');
    await queryInterface.dropTable('milestone_docs');
    await queryInterface.dropTable('documents');
    await queryInterface.dropTable('project_task');
    await queryInterface.dropTable('project_milestone');
    await queryInterface.dropTable('project_detail');
    await queryInterface.dropTable('project_consultant');
    await queryInterface.dropTable('project_industries');
    await queryInterface.dropTable('project');
    await queryInterface.dropTable('industries');
    await queryInterface.dropTable('consultant_module');
    await queryInterface.dropTable('consultants');
    await queryInterface.dropTable('modules');
    await queryInterface.dropTable('users');
  }
};
