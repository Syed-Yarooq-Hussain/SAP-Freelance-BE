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

  // 🆕 Create Project Consultant
  async create(data: Partial<ProjectConsultant>): Promise<ProjectConsultant> {
    return this.projectConsultantModel.create(data);
  }

  // 📋 Get All Project Consultant
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

  // 🔍 Get Consultant By Id
  async findById(id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findByPk(id);
  }

  // 🔎 Get Consultant By ProjectId
  async findByProjectIdConsultantId(project_id: number, consultant_id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findOne({ where: { project_id, consultant_id } , raw: true });
  }

  // 🔎 Get Consultant By ConsultantId
  async findByConsultantId(consultant_id: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({ where: { consultant_id } });
  }

  // 🧠 Update Consultant
  async update(
    option: any,
    data: Partial<ProjectConsultant>,
  ): Promise<[number, ProjectConsultant[]]> {
    return this.projectConsultantModel.update(data, {
      where: option,
      returning: true,
    });
  }

  // ❌ Delete Consultant
  async delete(id: number): Promise<number> {
    return this.projectConsultantModel.destroy({ where: { id } });
  }
}
