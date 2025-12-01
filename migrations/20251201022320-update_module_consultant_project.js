'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1️⃣ Module table changes
    await queryInterface.removeColumn('module', 'parent_id');
    await queryInterface.addColumn('module', 'is_core', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // 2️⃣ Consultant_Module table changes
    await queryInterface.renameColumn('consultant_module', 'consultant_id', 'user_id');
    await queryInterface.removeColumn('consultant_module', 'module_id');
    await queryInterface.removeColumn('consultant_module', 'level_id');

    // 3️⃣ Consultant table changes
    await queryInterface.removeColumn('consultant', 'module_id');
    await queryInterface.removeColumn('consultant', 'level_id');
    await queryInterface.addColumn('consultant', 'level', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // 4️⃣ Project_Consultant table changes
    await queryInterface.renameColumn('project_consultant', 'is_joic_signed', 'is_doc_signed');
    await queryInterface.changeColumn('project_consultant', 'is_doc_signed', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // 4️⃣ Rollback Project_Consultant
    await queryInterface.renameColumn('project_consultant', 'is_doc_signed', 'is_joic_signed');
    await queryInterface.changeColumn('project_consultant', 'is_joic_signed', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    });

    // 3️⃣ Rollback Consultant table
    await queryInterface.removeColumn('consultant', 'level');
    await queryInterface.addColumn('consultant', 'module_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('consultant', 'level_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 2️⃣ Rollback Consultant_Module table
    await queryInterface.addColumn('consultant_module', 'module_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('consultant_module', 'level_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.renameColumn('consultant_module', 'user_id', 'consultant_id');

    // 1️⃣ Rollback Module table
    await queryInterface.removeColumn('module', 'is_core');
    await queryInterface.addColumn('module', 'parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
