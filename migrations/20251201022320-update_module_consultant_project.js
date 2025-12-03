'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * 1️⃣ MODULES TABLE
     *  - Remove parent_id (if exists)
     *  - Add is_core (if not exists)
     */
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

    /**
     * 2️⃣ CONSULTANT_MODULE TABLE
     *  - Rename consultant_id -> user_id (if still consultant_id)
     *  - Add module_id (if missing)
     *  - Remove level_id (if exists)
     */
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

    // ➕ Ensure module_id exists (your model expects it)
    if (!consultantModuleTable.module_id) {
      await queryInterface.addColumn('consultant_module', 'module_id', {
        type: Sequelize.INTEGER,
        allowNull: true, // keep safe for existing rows
        references: {
          model: 'modules',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', // or 'SET NULL' if you prefer
      });
    }

    if (consultantModuleTable.level_id) {
      await queryInterface.removeColumn('consultant_module', 'level_id');
    }

    /**
     * 3️⃣ CONSULTANTS TABLE
     *  - Remove module_id & level_id
     *  - Add level (string) if not exists
     */
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

    /**
     * 4️⃣ PROJECT_CONSULTANT TABLE
     *  - Rename is_joic_signed -> is_doc_signed
     *  - Make is_doc_signed BOOLEAN NOT NULL DEFAULT false
     */
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
    /**
     * 4️⃣ ROLLBACK PROJECT_CONSULTANT
     */
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

    /**
     * 3️⃣ ROLLBACK CONSULTANTS
     */
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

    /**
     * 2️⃣ ROLLBACK CONSULTANT_MODULE
     */
    const consultantModuleTable = await queryInterface.describeTable(
      'consultant_module'
    );

    // Remove module_id again on rollback
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

    /**
     * 1️⃣ ROLLBACK MODULES
     */
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
