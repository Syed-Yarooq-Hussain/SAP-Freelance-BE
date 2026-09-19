import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { QueryTypes, Transaction } from 'sequelize';
import { Project } from 'models/project.model';

const endpoint = 'https://api.frankfurter.dev/v2/rates?base=USD';
let refreshing: Promise<void> | undefined;

/** Cache only public FX data; fetching it never updates payments. */
export async function refreshUsdRates(force = false): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const [cache] = await Project.sequelize.query<{ fresh: boolean }>(
      `
      SELECT COALESCE(max(fetched_at)>now()-interval '24 hours',false) AS fresh
      FROM usd_exchange_rate WHERE currency<>'USD'
    `,
      { type: QueryTypes.SELECT },
    );
    if (!force && cache.fresh) return;
    try {
      const response = await fetch(endpoint, {
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`FX provider HTTP ${response.status}`);
      const rows = (await response.json()) as {
        base: string;
        quote: string;
        rate: number;
        date: string;
      }[];
      if (!Array.isArray(rows) || !rows.length)
        throw new Error('Invalid FX response');
      const rates = rows.filter(
        (row) =>
          row.base === 'USD' &&
          /^[A-Z]{3}$/.test(row.quote) &&
          Number.isFinite(row.rate) &&
          row.rate > 0 &&
          /^\d{4}-\d{2}-\d{2}$/.test(row.date),
      );
      if (rates.length !== rows.length) throw new Error('Invalid FX rate');
      await Project.sequelize.query(
        `
        INSERT INTO usd_exchange_rate(currency,units_per_usd,as_of,source)
        SELECT item->>'quote',(item->>'rate')::numeric,(item->>'date')::date,:source
        FROM jsonb_array_elements(CAST(:rates AS jsonb)) AS entries(item)
        ON CONFLICT(currency) DO UPDATE SET units_per_usd=EXCLUDED.units_per_usd,
          as_of=EXCLUDED.as_of,fetched_at=now(),source=EXCLUDED.source
      `,
        { replacements: { rates: JSON.stringify(rates), source: endpoint } },
      );
    } catch (error) {
      // A bounded persisted cache permits billing during a temporary provider outage.
      const [cache] = await Project.sequelize.query<{ usable: boolean }>(
        `
        SELECT EXISTS(SELECT 1 FROM usd_exchange_rate WHERE currency<>'USD'
          AND fetched_at>now()-interval '7 days' AND as_of>=CURRENT_DATE-7) AS usable
      `,
        { type: QueryTypes.SELECT },
      );
      if (!cache.usable)
        throw new ServiceUnavailableException(
          'USD exchange rates are unavailable; please retry shortly',
        );
    }
  })().finally(() => {
    refreshing = undefined;
  });
  return refreshing;
}

export async function usdClientRates(
  items: { currency?: string; rate: unknown; decided_rate?: unknown }[],
  margin: number,
  transaction?: Transaction,
) {
  if (!items.length) return [];
  const rows = await Project.sequelize.query<{
    index: number;
    rate: number;
    decided_rate: number;
    available: boolean;
    source_currency: string;
    fx_as_of: string;
  }>(
    `
    SELECT (ordinality-1)::integer AS index,
      upper(COALESCE(NULLIF(trim(item->>'currency'),''),'USD')) AS source_currency,
      (CASE WHEN fx.currency='USD' OR (fx.fetched_at>now()-interval '7 days' AND fx.as_of>=CURRENT_DATE-7) THEN true ELSE false END) AS available,
      round(COALESCE((item->>'rate')::numeric,0)/fx.units_per_usd*(1 + CAST(:margin AS numeric)/100),2)::float8 AS rate,
      round(COALESCE((item->>'decided_rate')::numeric,0)/fx.units_per_usd*(1 + CAST(:margin AS numeric)/100),2)::float8 AS decided_rate,
      fx.as_of::text AS fx_as_of
    FROM jsonb_array_elements(CAST(:items AS jsonb)) WITH ORDINALITY AS entries(item,ordinality)
    LEFT JOIN usd_exchange_rate fx ON fx.currency=upper(COALESCE(NULLIF(trim(item->>'currency'),''),'USD'))
    ORDER BY ordinality
  `,
    {
      replacements: { items: JSON.stringify(items), margin },
      transaction,
      type: QueryTypes.SELECT,
    },
  );
  if (rows.some((row) => !row.available))
    throw new ServiceUnavailableException(
      'A required USD exchange rate is unavailable; please retry shortly',
    );
  return rows;
}

@Injectable()
export class UsdExchangeRateService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UsdExchangeRateService.name);
  private timer?: ReturnType<typeof setInterval>;

  async onModuleInit() {
    await this.refresh();
    this.timer = setInterval(() => void this.refresh(), 60 * 60 * 1000);
    this.timer.unref();
  }

  private async refresh() {
    try {
      await refreshUsdRates();
      // Adopt pre-upgrade unpaid teams once. Refreshing the FX cache does not
      // continually reprice saved quotes, and GET never calls this adoption.
      const milestones = await Project.sequelize.query<{ id: string }>(
        `
        SELECT id FROM project_milestone WHERE team_configured AND deleted_at IS NULL
          AND team_currency<>'USD' AND NOT milestone_team_locked(id) ORDER BY project_id,id
      `,
        { type: QueryTypes.SELECT },
      );
      for (const milestone of milestones) {
        await Project.sequelize.transaction(async (transaction) => {
          await Project.sequelize.query(
            'SELECT milestone_team_sync(CAST(:id AS bigint))',
            {
              replacements: { id: milestone.id },
              transaction,
            },
          );
          await Project.sequelize.query(
            'UPDATE project_milestone SET team_revision=team_revision+1 WHERE id=:id AND NOT milestone_team_locked(id)',
            {
              replacements: { id: milestone.id },
              transaction,
            },
          );
        });
      }
    } catch (error) {
      this.logger.warn(error.message);
    }
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
}
