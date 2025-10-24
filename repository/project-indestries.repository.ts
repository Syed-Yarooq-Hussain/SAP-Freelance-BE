import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectIndustry } from '../models/project-industries.model';

@Injectable()
export class ProjectIndustriesRepository {
  constructor(
    @InjectModel(ProjectIndustry)
    private readonly projectIndustryModel: typeof ProjectIndustry,
  ) {}

  // 🆕 Create new industry
  async create(data: Partial<ProjectIndustry>): Promise<ProjectIndustry> {
    return this.projectIndustryModel.create(data);
  }

  // 📋 Get all industries (optional filter)
  async findAll(options?: any): Promise<ProjectIndustry[]> {
    return this.projectIndustryModel.findAll(options);
  }

  // 🔍 Find by ID
  async findById(id: number): Promise<ProjectIndustry | null> {
    return this.projectIndustryModel.findByPk(id);
  }

  // 🔎 Find by project ID
  async findByProjectId(project_id: number): Promise<ProjectIndustry[]> {
    return this.projectIndustryModel.findAll({ where: { project_id } });
  }

  // 🧠 Update industry
  async update(
    id: number,
    data: Partial<ProjectIndustry>,
  ): Promise<[number, ProjectIndustry[]]> {
    return this.projectIndustryModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete industry
  async delete(id: number): Promise<number> {
    return this.projectIndustryModel.destroy({ where: { id } });
  }
}
