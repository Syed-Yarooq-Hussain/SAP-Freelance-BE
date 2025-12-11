import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectDetail } from '../models/project-detail.model';

@Injectable()
export class ProjectDetailRepository {
  constructor(
    @InjectModel(ProjectDetail)
    private readonly projectDetailModel: typeof ProjectDetail,
  ) {}

  // 🆕 Create Project Detail
  async create(data: Partial<ProjectDetail>): Promise<ProjectDetail> {
    return this.projectDetailModel.create(data, { raw: true });
  }

  // 📋 Get All Project Details 
  async findAll(): Promise<ProjectDetail[]> {
    return this.projectDetailModel.findAll();
  }

  // 🔍 Get Project Detail By Id
  async findById(id: number): Promise<ProjectDetail | null> {
    return this.projectDetailModel.findByPk(id);
  }

  // 🔎 Get Project Detail By ProjectId
  async findByProjectId(project_id: number): Promise<ProjectDetail | null> {
    return this.projectDetailModel.findOne({ where: { project_id } });
  }

  // 🧠 Update Project Detail
  async update(
    id: number,
    data: Partial<ProjectDetail>,
  ): Promise<[number, ProjectDetail[]]> {
    return this.projectDetailModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Project Detail
  async delete(id: number): Promise<number> {
    return this.projectDetailModel.destroy({ where: { id } });
  }
}
