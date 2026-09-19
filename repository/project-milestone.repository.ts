import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMilestone } from '../models/project-milestone.model';
import { Op, literal, ProjectionAlias } from 'sequelize';

const teamAttributes = {
  include: [[literal('milestone_team_snapshot("ProjectMilestone"."id")'), 'team'] as ProjectionAlias],
};

@Injectable()
export class ProjectMilestoneRepository {
  constructor(
    @InjectModel(ProjectMilestone)
    private readonly projectMilestoneModel: typeof ProjectMilestone,
  ) {}

  // 🆕 Create Milestone
  async create(data: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    return this.projectMilestoneModel.create(data);
  }

  // 📋 Get All Milestones (With Optional Filter)
  async findAll(options?: any): Promise<ProjectMilestone[]> {
    return this.projectMilestoneModel.findAll({ attributes: teamAttributes, ...options });
  }

  // 🔍 Get Milestone By Id
  async findById(id: number): Promise<ProjectMilestone | null> {
    return this.projectMilestoneModel.findByPk(id, { attributes: teamAttributes });
  }

  // 🔍 Get Milestone Task By Id
  async findByIdWithTasks(id: number): Promise<ProjectMilestone | null> {
    return await this.projectMilestoneModel.findOne({
    attributes: teamAttributes,
    where: { id },
    include: [
      {
        association: 'tasks',
      },
    ],
  });
  }

  // 🔎 Get Milestones By Project Id
  async findByProjectId(project_id: number, transaction?: any): Promise<ProjectMilestone[]> {
    return this.projectMilestoneModel.findAll({ where: { project_id }, transaction });
  }

  // 🧠 Update Milestone
  async update(
  id: number,
  data: Partial<ProjectMilestone>,
): Promise<ProjectMilestone> {
  const [, [updated]] = await this.projectMilestoneModel.update(data, {
    where: { id },
    returning: true,
  });

  return updated;
}


  // ❌ Delete Milestone
  async delete(id: number): Promise<number> {
    return this.projectMilestoneModel.destroy({ where: { id } });
  }

  async bulkCreateMilestones(
    data: Partial<ProjectMilestone>[],
    transaction?: any,
  ) {
    return this.projectMilestoneModel.bulkCreate(data, { transaction });
  }

  async findOverlapping(
  projectId: number,
  startDate: Date,
  dueDate: Date,
  excludeId?: number,
): Promise<ProjectMilestone | null> {
  const where: any = {
    project_id: projectId,
    start_date: { [Op.lte]: dueDate },
    due_date: { [Op.gte]: startDate },
  };

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  return this.projectMilestoneModel.findOne({ where });
}
}
