import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { QueryTypes, Transaction } from 'sequelize';
import { Project } from 'models/project.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { assertProjectAccess, validateProjectId } from './project-access';

import { SaveMilestoneTeamDto } from './dto/milestone-team.dto';

@Injectable()
export class MilestoneTeamService {

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
    assertProjectAccess(
      await Project.findByPk(validateProjectId(projectId)),
      user,
    );
    throw new ConflictException(
      'Milestone hours are now automatic: update the selected project team weekly hours or milestone dates instead of saving allocations',
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
