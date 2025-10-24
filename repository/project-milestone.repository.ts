import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMilestone } from '../models/project-milestone.model';

@Injectable()
export class ProjectMilestoneRepository {
  constructor(
    @InjectModel(ProjectMilestone)
    private readonly projectMilestoneModel: typeof ProjectMilestone,
  ) {}

  // 🆕 Create new milestone
  async create(data: Partial<ProjectMilestone>): Promise<ProjectMilestone> {
    return this.projectMilestoneModel.create(data);
  }

  // 📋 Get all milestones (with optional filter)
  async findAll(options?: any): Promise<ProjectMilestone[]> {
    return this.projectMilestoneModel.findAll(options);
  }

  // 🔍 Find milestone by ID
  async findById(id: number): Promise<ProjectMilestone | null> {
    return this.projectMilestoneModel.findByPk(id);
  }

  // 🔎 Find milestones by project ID
  async findByProjectId(projectId: number): Promise<ProjectMilestone[]> {
    return this.projectMilestoneModel.findAll({ where: { projectId } });
  }

  // 🧠 Update milestone
  async update(
    id: number,
    data: Partial<ProjectMilestone>,
  ): Promise<[number, ProjectMilestone[]]> {
    return this.projectMilestoneModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete milestone
  async delete(id: number): Promise<number> {
    return this.projectMilestoneModel.destroy({ where: { id } });
  }
}
