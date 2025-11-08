import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../models/project.model';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  // Add new project
  async create(data: Partial<Project>): Promise<Project> {
    return this.projectModel.create(data);
  }

  // 📋 Sab projects get karne ke liye
  async findAll(): Promise<Project[]> {
    return this.projectModel.findAll({
      include: [
        'projectConsultants',
        'projectIndustries',
        'projectDetails',
        'milestones',
        'tasks',
        'payments',
      ],
    });
  }

  // 🔍 Project ko ID se find karne ke liye
  async findById(id: number): Promise<Project | null> {
    return this.projectModel.findByPk(id, {
      include: [
      {
        association: 'projectDetails', 
      }], 
      raw: true
    });
  }

  // 🔎 Client ID ke zariye projects laane ke liye
  async findByClientId(client_id: number): Promise<Project[]> {
    return this.projectModel.findAll({ where: { client_id } });
  }

  // 🧠 Project update karne ke liye
  async update(
    id: number,
    data: Partial<Project>,
  ): Promise<[number, Project[]]> {
    return this.projectModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Project delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.projectModel.destroy({ where: { id } });
  }
}
