'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        CREATE TABLE usd_exchange_rate (
          currency varchar(3) PRIMARY KEY CHECK (currency ~ '^[A-Z]{3}$'),
          units_per_usd numeric NOT NULL CHECK (units_per_usd > 0 AND units_per_usd::text NOT IN ('NaN','Infinity','-Infinity')),
          as_of date NOT NULL,
          fetched_at timestamptz NOT NULL DEFAULT now(),
          source text NOT NULL
        );
        INSERT INTO usd_exchange_rate(currency,units_per_usd,as_of,source) VALUES('USD',1,CURRENT_DATE,'identity');
        ALTER TABLE milestone_allocation
          ADD COLUMN source_currency varchar(3),
          ADD COLUMN fx_units_per_usd numeric,
          ADD COLUMN fx_as_of date,
          ADD COLUMN fx_source text;
        ${fs.readFileSync(path.join(__dirname, 'sql/milestone-usd-up.sql'), 'utf8')}
      `,
        { transaction },
      );
    });
  },
  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Reverting converted billing would relabel money and lose audit data.
      await queryInterface.sequelize.query(
        `
        DO $$ BEGIN
          IF EXISTS(SELECT 1 FROM milestone_allocation WHERE fx_as_of IS NOT NULL) THEN
            RAISE EXCEPTION 'Reconcile USD-converted allocations before reverting the currency migration';
          END IF;
        END $$;
        ${fs.readFileSync(path.join(__dirname, 'sql/milestone-usd-down.sql'), 'utf8')}
        ALTER TABLE milestone_allocation DROP COLUMN source_currency, DROP COLUMN fx_units_per_usd,
          DROP COLUMN fx_as_of, DROP COLUMN fx_source;
        DROP TABLE usd_exchange_rate;
      `,
        { transaction },
      );
    });
  },
};
