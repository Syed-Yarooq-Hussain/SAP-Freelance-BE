import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectMilestone } from '../models/project-milestone.model';
import { raw } from 'express';
import { ProjectTask } from 'models/project-task.model';

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

  // 🔎 Find milestones by project ID
  async findByProjectId(project_id: number): Promise<ProjectMilestone[]> {
    return this.projectMilestoneModel.findAll({ where: { project_id } });
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
