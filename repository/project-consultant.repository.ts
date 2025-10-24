import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectConsultant } from '../models/project-consultant.model';

@Injectable()
export class ProjectConsultantRepository {
  constructor(
    @InjectModel(ProjectConsultant)
    private readonly projectConsultantModel: typeof ProjectConsultant,
  ) {}

  // 🆕 Naya project consultant entry create karne ke liye
  async create(data: Partial<ProjectConsultant>): Promise<ProjectConsultant> {
    return this.projectConsultantModel.create(data);
  }

  // 📋 Sab project-consultants get karne ke liye (optionally filter bhi kar sakte ho)
  async findAll(options?: any): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll(options);
  }

  // 🔍 Specific consultant ko ID se find karne ke liye
  async findById(id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findByPk(id);
  }

  // 🔎 Consultant ko projectId ke zariye dhoondhne ke liye
  async findByProjectId(projectId: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({ where: { projectId } });
  }

  // 🔎 Consultant ko consultantId ke zariye dhoondhne ke liye
  async findByConsultantId(consultantId: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({ where: { consultantId } });
  }

  // 🧠 Consultant update karne ke liye
  async update(
    id: number,
    data: Partial<ProjectConsultant>,
  ): Promise<[number, ProjectConsultant[]]> {
    return this.projectConsultantModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Consultant delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.projectConsultantModel.destroy({ where: { id } });
  }
}
