import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectConsultant } from '../models/project-consultant.model';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';

@Injectable()
export class ProjectConsultantRepository {
  constructor(
    @InjectModel(ProjectConsultant)
    private readonly projectConsultantModel: typeof ProjectConsultant,
  ) {}

  // 🆕 Add project consultant
  async create(data: Partial<ProjectConsultant>): Promise<ProjectConsultant> {
    return this.projectConsultantModel.create(data);
  }

  async findAll(options?: any, status: string = 'shortlisted'): Promise<ProjectConsultant[]> {
  return this.projectConsultantModel.findAll({
    ...options,
    include: [
      {
        model: User,
        as: 'user',
        include: [
          {
            model: Consultant,
            as: 'consultants',
          },
        ],
      },
    ],
  });
}

  // 🔍 Specific consultant ko ID se find karne ke liye
  async findById(id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findByPk(id);
  }

  // 🔎 Consultant ko projectId ke zariye dhoondhne ke liye
  async findByProjectIdConsultantId(project_id: number, consultant_id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findOne({ where: { project_id, consultant_id } , raw: true });
  }

  // 🔎 Consultant ko consultantId ke zariye dhoondhne ke liye
  async findByConsultantId(consultant_id: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({ where: { consultant_id } });
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
