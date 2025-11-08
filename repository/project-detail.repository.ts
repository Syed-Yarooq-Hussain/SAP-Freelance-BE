import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectDetail } from '../models/project-detail.model';
import { raw } from 'express';

@Injectable()
export class ProjectDetailRepository {
  constructor(
    @InjectModel(ProjectDetail)
    private readonly projectDetailModel: typeof ProjectDetail,
  ) {}

  // 🆕 Naya project detail create karne ke liye
  async create(data: Partial<ProjectDetail>): Promise<ProjectDetail> {
    return this.projectDetailModel.create(data, { raw: true });
  }

  // 📋 Sab project details get karne ke liye
  async findAll(): Promise<ProjectDetail[]> {
    return this.projectDetailModel.findAll();
  }

  // 🔍 Specific project detail ko ID se find karne ke liye
  async findById(id: number): Promise<ProjectDetail | null> {
    return this.projectDetailModel.findByPk(id);
  }

  // 🔎 Specific projectId ke zariye project detail dhoondhne ke liye
  async findByProjectId(project_id: number): Promise<ProjectDetail | null> {
    return this.projectDetailModel.findOne({ where: { project_id } });
  }

  // 🧠 Project detail update karne ke liye
  async update(
    id: number,
    data: Partial<ProjectDetail>,
  ): Promise<[number, ProjectDetail[]]> {
    return this.projectDetailModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Project detail delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.projectDetailModel.destroy({ where: { id } });
  }
}
