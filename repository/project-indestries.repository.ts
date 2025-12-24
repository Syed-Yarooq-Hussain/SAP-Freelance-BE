import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectIndustry } from '../models/project-industries.model';

@Injectable()
export class ProjectIndustriesRepository {
  constructor(
    @InjectModel(ProjectIndustry)
    private readonly projectIndustryModel: typeof ProjectIndustry,
  ) {}

  // 🆕 Create Industry
  async create(data: Partial<ProjectIndustry>): Promise<ProjectIndustry> {
    return this.projectIndustryModel.create(data);
  }

  // 📋 Get All Industries (Optional Filter)
  async findAll(options?: any): Promise<ProjectIndustry[]> {
    return this.projectIndustryModel.findAll(options);
  }

  // 🔍 Get Project Industry By Id
  async findById(id: number): Promise<ProjectIndustry | null> {
    return this.projectIndustryModel.findByPk(id);
  }

  // 🔎 Get Industry By Project Id
  async findByProjectId(project_id: number): Promise<ProjectIndustry[]> {
    return this.projectIndustryModel.findAll({ where: { project_id } });
  }

  // 🧠 Update Industry
  async update(
    id: number,
    data: Partial<ProjectIndustry>,
  ): Promise<[number, ProjectIndustry[]]> {
    return this.projectIndustryModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Industry
  async delete(id: number): Promise<number> {
    return this.projectIndustryModel.destroy({ where: { id } });
  }
}
