'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 1️⃣ MODULES TABLE

    const modulesTable = await queryInterface.describeTable('modules');

    if (modulesTable.parent_id) {
      await queryInterface.removeColumn('modules', 'parent_id');
    }

    if (!modulesTable.is_core) {
      await queryInterface.addColumn('modules', 'is_core', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
    
    // 2️⃣ CONSULTANT MODULE TABLE
    
    const consultantModuleTable = await queryInterface.describeTable(
      'consultant_module'
    );

    if (consultantModuleTable.consultant_id && !consultantModuleTable.user_id) {
      await queryInterface.renameColumn(
        'consultant_module',
        'consultant_id',
        'user_id'
      );
    }

    if (!consultantModuleTable.module_id) {
      await queryInterface.addColumn('consultant_module', 'module_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'modules',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }

    if (consultantModuleTable.level_id) {
      await queryInterface.removeColumn('consultant_module', 'level_id');
    }
    
    // 3️⃣ CONSULTANTS TABLE
     
    const consultantsTable = await queryInterface.describeTable('consultants');

    if (consultantsTable.module_id) {
      await queryInterface.removeColumn('consultants', 'module_id');
    }

    if (consultantsTable.level_id) {
      await queryInterface.removeColumn('consultants', 'level_id');
    }

    if (!consultantsTable.level) {
      await queryInterface.addColumn('consultants', 'level', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
    
    // 4️⃣ PROJECT CONSULTANT TABLE
    const projectConsultantTable = await queryInterface.describeTable(
      'project_consultant'
    );

    if (projectConsultantTable.is_joic_signed && !projectConsultantTable.is_doc_signed) {
      await queryInterface.renameColumn(
        'project_consultant',
        'is_joic_signed',
        'is_doc_signed'
      );
    }

    const projectConsultantAfterRename = await queryInterface.describeTable(
      'project_consultant'
    );

    if (projectConsultantAfterRename.is_doc_signed) {
      await queryInterface.changeColumn('project_consultant', 'is_doc_signed', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }
  },

  async down(queryInterface, Sequelize) {
  
    // 4️⃣ ROLLBACK PROJECT CONSULTANT TABLE
    
    const projectConsultantTable = await queryInterface.describeTable(
      'project_consultant'
    );

    if (projectConsultantTable.is_doc_signed && !projectConsultantTable.is_joic_signed) {
      await queryInterface.renameColumn(
        'project_consultant',
        'is_doc_signed',
        'is_joic_signed'
      );
    }

    const projectConsultantAfterRename = await queryInterface.describeTable(
      'project_consultant'
    );

    if (projectConsultantAfterRename.is_joic_signed) {
      await queryInterface.changeColumn('project_consultant', 'is_joic_signed', {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      });
    }

    // 3️⃣ ROLLBACK CONSULTANTS TABLE
    
    const consultantsTable = await queryInterface.describeTable('consultants');

    if (consultantsTable.level) {
      await queryInterface.removeColumn('consultants', 'level');
    }

    if (!consultantsTable.module_id) {
      await queryInterface.addColumn('consultants', 'module_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (!consultantsTable.level_id) {
      await queryInterface.addColumn('consultants', 'level_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  
    // 2️⃣ ROLLBACK CONSULTANT MODULE TABLE
    
    const consultantModuleTable = await queryInterface.describeTable(
      'consultant_module'
    );

    if (consultantModuleTable.module_id) {
      await queryInterface.removeColumn('consultant_module', 'module_id');
    }

    if (!consultantModuleTable.level_id) {
      await queryInterface.addColumn('consultant_module', 'level_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }

    if (consultantModuleTable.user_id && !consultantModuleTable.consultant_id) {
      await queryInterface.renameColumn(
        'consultant_module',
        'user_id',
        'consultant_id'
      );
    }

    // 1️⃣ ROLLBACK MODULES TABLE
     
    const modulesTable = await queryInterface.describeTable('modules');

    if (modulesTable.is_core) {
      await queryInterface.removeColumn('modules', 'is_core');
    }

    if (!modulesTable.parent_id) {
      await queryInterface.addColumn('modules', 'parent_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },
};
