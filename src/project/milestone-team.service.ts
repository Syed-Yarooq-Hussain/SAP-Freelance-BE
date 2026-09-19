import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryTypes, Transaction } from 'sequelize';
import { Project } from 'models/project.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { assertProjectAccess, validateProjectId } from './project-access';
import { TeamBuilderService } from './team-builder.service';
import { SaveMilestoneTeamDto } from './dto/milestone-team.dto';
import { refreshUsdRates } from './usd-exchange-rate.service';

@Injectable()
export class MilestoneTeamService {
  constructor(private readonly teamBuilder: TeamBuilderService) {}

  private async milestone(
    projectId: number,
    milestoneId: number,
    transaction: Transaction,
    lock = false,
  ) {
    validateProjectId(milestoneId);
    const milestone = await ProjectMilestone.findOne({
      where: { id: milestoneId, project_id: projectId, deleted_at: null },
      transaction,
      ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
    });
    if (!milestone)
      throw new NotFoundException('Milestone does not belong to this project');
    return milestone;
  }

  private async snapshot(milestoneId: number, transaction: Transaction) {
    const [row] = await Project.sequelize.query<{ data: any }>(
      'SELECT milestone_team_snapshot(:id) AS data',
      {
        replacements: { id: milestoneId },
        transaction,
        type: QueryTypes.SELECT,
      },
    );
    return row.data;
  }

  async get(projectId: number, milestoneId: number, user: any) {
    validateProjectId(projectId);
    return Project.sequelize.transaction(
      {
        isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
        readOnly: true,
      },
      async (transaction) => {
        assertProjectAccess(
          await Project.findByPk(projectId, { transaction }),
          user,
        );
        await this.milestone(projectId, milestoneId, transaction);
        return {
          message: 'Milestone team loaded',
          data: await this.snapshot(milestoneId, transaction),
        };
      },
    );
  }

  async save(
    projectId: number,
    milestoneId: number,
    dto: SaveMilestoneTeamDto,
    user: any,
  ) {
    const ids = dto.allocations.map((allocation) => allocation.consultant_id);
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException('Duplicate consultant IDs');
    // Refresh outside the write transaction; its SQL calculation snapshots FX.
    assertProjectAccess(
      await Project.findByPk(validateProjectId(projectId)),
      user,
    );
    if (ids.length) {
      const [foreign] = await Project.sequelize.query<{ needed: boolean }>(
        `
        SELECT EXISTS(SELECT 1 FROM users WHERE id IN (:ids)
          AND upper(COALESCE(NULLIF(trim(currency),''),'USD'))<>'USD') AS needed
      `,
        { replacements: { ids }, type: QueryTypes.SELECT },
      );
      if (foreign.needed) await refreshUsdRates();
    }
    return this.teamBuilder.locked(
      projectId,
      user,
      async (_project, transaction) => {
        const milestone = await this.milestone(
          projectId,
          milestoneId,
          transaction,
          true,
        );
        const current = await this.snapshot(milestoneId, transaction);
        if (current.locked)
          throw new ConflictException('Paid milestone allocations are locked');
        if (milestone.team_revision !== dto.revision)
          throw new ConflictException(
            'Milestone team changed; reload before saving',
          );
        if (ids.length) {
          const members = await Project.sequelize.query<{
            consultant_id: string;
          }>(
            `
          SELECT pc.consultant_id::text FROM project_consultant pc
          JOIN users u ON u.id=pc.consultant_id AND u.deleted_at IS NULL AND u.role=2
          JOIN consultants c ON c.user_id=u.id AND c.deleted_at IS NULL
          WHERE pc.project_id=:projectId AND pc.consultant_id IN (:ids) AND pc.deleted_at IS NULL
            AND lower(pc.status) IN ('shortlisted','interview-schedule','interviewed','offered','hired')
        `,
            {
              replacements: { projectId, ids },
              transaction,
              type: QueryTypes.SELECT,
            },
          );
          if (
            members.length !== ids.length ||
            new Set(members.map((member) => member.consultant_id)).size !==
              ids.length
          )
            throw new BadRequestException(
              'Each allocation must reference one eligible consultant in this project',
            );
        }
        const options = { replacements: { id: milestoneId }, transaction };
        await Project.sequelize.query(
          'DELETE FROM milestone_allocation WHERE milestone_id=:id',
          options,
        );
        if (dto.allocations.length) {
          await Project.sequelize.query(
            `
          INSERT INTO milestone_allocation(milestone_id,consultant_id,hours,position)
          SELECT :id,(item->>'consultant_id')::integer,(item->>'hours')::numeric,ordinality::integer
          FROM jsonb_array_elements(CAST(:allocations AS jsonb)) WITH ORDINALITY AS entries(item,ordinality)
        `,
            {
              ...options,
              replacements: {
                id: milestoneId,
                allocations: JSON.stringify(dto.allocations),
              },
            },
          );
        }
        await milestone.update(
          { team_configured: true, team_revision: dto.revision + 1 },
          { transaction },
        );
        await syncMilestoneTeam(milestoneId, transaction);
        return {
          message: 'Milestone team saved',
          data: await this.snapshot(milestoneId, transaction),
        };
      },
    );
  }
}

/** SQL function also serves transactional status, rate and pricing triggers. */
export async function syncMilestoneTeam(
  milestoneId: number,
  transaction?: Transaction,
) {
  await Project.sequelize.query('SELECT milestone_team_sync(:id)', {
    replacements: { id: milestoneId },
    transaction,
  });
}
