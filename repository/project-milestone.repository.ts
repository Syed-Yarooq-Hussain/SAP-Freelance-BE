import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMilestone } from '../models/project-milestone.model';

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
    return this.projectMilestoneModel.findAll(options);
  }

  // 🔍 Get Milestone By Id
  async findById(id: number): Promise<ProjectMilestone | null> {
    return this.projectMilestoneModel.findByPk(id);
  }

  // 🔍 Get Milestone Task By Id
  async findByIdWithTasks(id: number): Promise<ProjectMilestone | null> {
    return await this.projectMilestoneModel.findOne({
    where: { id },
    include: [
      {
        association: 'tasks',
      },
    ],
  });
  }

  // 🔎 Get Milestones By Project Id
  async findByProjectId(project_id: number): Promise<ProjectMilestone[]> {
    return this.projectMilestoneModel.findAll({ where: { project_id } });
  }

  // 🧠 Update Milestone
  async update(
    id: number,
    data: Partial<ProjectMilestone>,
  ): Promise<[number, ProjectMilestone[]]> {
    return this.projectMilestoneModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Milestone
  async delete(id: number): Promise<number> {
    return this.projectMilestoneModel.destroy({ where: { id } });
  }
}
