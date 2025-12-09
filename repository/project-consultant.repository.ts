import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectConsultant } from '../models/project-consultant.model';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { Project } from 'models/project.model';
import { ProjectDetail } from 'models/project-detail.model';

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

  async findById(id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findByPk(id);
  }

  async findByProjectIdConsultantId(project_id: number, consultant_id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findOne({ where: { project_id, consultant_id } , raw: true });
  }

  async findByConsultantId(consultant_id: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({
      where: { consultant_id },
      attributes: ['requested_hours'],
      include: [
        {
          model: Project,
          attributes: ['id', 'name', 'status'],
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['id', 'username'],
            },
            {
              model: ProjectDetail,
              attributes: ['start_date'],
            }
          ]
        }
      ]
    });
  }
  
  async findBookingScheduleByConsultantId(consultant_id: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({
      where: { consultant_id },
      attributes: ['id', 'booking_schedule'],
      include: [
        {
          model: Project,
          attributes: ['name'],
        }
      ]
    });
  }

  async update(
    option: any,
    data: Partial<ProjectConsultant>,
  ): Promise<[number, ProjectConsultant[]]> {
    return this.projectConsultantModel.update(data, {
      where: option,
      returning: true,
    });
  }

  async delete(id: number): Promise<number> {
    return this.projectConsultantModel.destroy({ where: { id } });
  }
}
