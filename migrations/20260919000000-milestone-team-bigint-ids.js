'use strict';

const fs = require('fs');
const path = require('path');

// Keep the original migration immutable for databases that already applied it.
// Reinstall its function bodies with ID types matching the legacy BIGINT schema.
function definitions(bigint) {
  const source = fs.readFileSync(
    path.join(__dirname, 'sql/milestone-teams-up.sql'),
    'utf8',
  );
  let sql = source.slice(source.indexOf('CREATE FUNCTION milestone_team_locked'));
  sql = sql.replace(/CREATE TRIGGER[\s\S]*?EXECUTE FUNCTION[^;]+;/g, '');
  sql = sql.replace(/CREATE FUNCTION/g, 'CREATE OR REPLACE FUNCTION');
  return bigint ? sql.replace(/\binteger\b/g, 'bigint') : sql;
}

const functions = [
  'milestone_team_snapshot',
  'milestone_team_sync',
  'milestone_project_totals',
  'milestone_team_locked',
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE milestone_allocation
           ALTER COLUMN milestone_id TYPE bigint,
           ALTER COLUMN consultant_id TYPE bigint;
         ${definitions(true)}
         ${functions.map(name => `DROP FUNCTION ${name}(integer);`).join('\n')}`,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `${definitions(false)}
         ${functions.map(name => `DROP FUNCTION ${name}(bigint);`).join('\n')}
         ALTER TABLE milestone_allocation
           ALTER COLUMN milestone_id TYPE integer,
           ALTER COLUMN consultant_id TYPE integer;`,
        { transaction },
      );
    });
  },
};
