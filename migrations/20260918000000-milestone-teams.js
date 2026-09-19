'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        fs.readFileSync(
          path.join(__dirname, 'sql/milestone-teams-up.sql'),
          'utf8',
        ),
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        fs.readFileSync(
          path.join(__dirname, 'sql/milestone-teams-down.sql'),
          'utf8',
        ),
        { transaction },
      );
    });
  },
};
