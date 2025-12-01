import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectConsultant } from '../models/project-consultant.model';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';

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

  async findAll(options?: any): Promise<ProjectConsultant[]> {
  return this.projectConsultantModel.findAll({
    ...options,
    attributes: ['status', 'role', 'decided_rate', 'is_doc_signed', 'booking_schedule', 'id'],
    include: [
      {
        model: User,
        attributes: ['id', 'username'],
          include: [
            {
              model: Consultant,
              required: true,
              attributes: [ 'weekly_available_hours', 'rate', 'experience', 'working_schedule' ],
            },
            {
              model: ConsultantModule,
              required: false,
              attributes: ['id'],
              include: [
                {
                  model: ModuleEntity,
                  required: false,
                  attributes: ['id', 'name', 'is_core'],
                },
              ],
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
