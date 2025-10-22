import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectTask } from '../models/project-task.model';

@Injectable()
export class ProjectTaskRepository {
  constructor(
    @InjectModel(ProjectTask)
    private readonly projectTaskModel: typeof ProjectTask,
  ) {}

  // 🆕 Create new task
  async create(data: Partial<ProjectTask>): Promise<ProjectTask> {
    return this.projectTaskModel.create(data);
  }

  // 📋 Get all tasks (with optional filters)
  async findAll(options?: any): Promise<ProjectTask[]> {
    return this.projectTaskModel.findAll(options);
  }

  // 🔍 Find task by ID
  async findById(id: number): Promise<ProjectTask | null> {
    return this.projectTaskModel.findByPk(id);
  }

  // 🔎 Find tasks by project ID
  async findByProjectId(project_id: number): Promise<ProjectTask[]> {
    return this.projectTaskModel.findAll({ where: { project_id } });
  }

  // 🧠 Update a task
  async update(
    id: number,
    data: Partial<ProjectTask>,
  ): Promise<[number, ProjectTask[]]> {
    return this.projectTaskModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete a task
  async delete(id: number): Promise<number> {
    return this.projectTaskModel.destroy({ where: { id } });
  }
}
