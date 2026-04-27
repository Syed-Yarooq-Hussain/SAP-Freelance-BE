import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectTask } from '../models/project-task.model';

@Injectable()
export class ProjectTaskRepository {
  constructor(
    @InjectModel(ProjectTask)
    private readonly projectTaskModel: typeof ProjectTask,
  ) {}

  // 🆕 Create Project Task
  async create(data: Partial<ProjectTask>): Promise<ProjectTask> {
    return this.projectTaskModel.create(data);
  }

  // 📋 Get All Tasks (With Optional Filters)
  async findAll(options?: any): Promise<ProjectTask[]> {
    return this.projectTaskModel.findAll(options);
  }

  // 🔍 Get Task By Id
  async findById(id: number): Promise<ProjectTask | null> {
    return this.projectTaskModel.findOne({where: { id } });
  }

  // 🔎 Get Tasks By Project Id
  async findByProjectId(project_id: number): Promise<ProjectTask[]> {
    return this.projectTaskModel.findAll({ where: { project_id } });
  }

  // 🧠 Update Task
  async update(
    id: number,
    data: Partial<ProjectTask>,
  ): Promise<[number, ProjectTask[]]> {
    return this.projectTaskModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Task
  async delete(id: number): Promise<number> {
    return this.projectTaskModel.destroy({ where: { id } });
  }

  // 🔄 Clear assignee for deleted user
  async clearAssignee(userId: number): Promise<[number, ProjectTask[]]> {
    return this.projectTaskModel.update(
      { assignee_id: null },
      { where: { assignee_id: userId }, returning: true },
    );
  }
}
