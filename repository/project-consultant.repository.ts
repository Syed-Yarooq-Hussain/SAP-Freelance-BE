import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectConsultant } from '../models/project-consultant.model';
import { User } from 'models/user.model';
import { Consultant } from 'models/consultant.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { Project } from 'models/project.model';
import { ProjectDetail } from 'models/project-detail.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';
import { Meeting } from 'models/meeting.model';
import { Op } from 'sequelize';

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
  console.log('options', options);
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
            {
              model: MeetingInvitee,
              required: false,
              attributes: ['id'],
              include: [
                {
                  model: Meeting,
                  required: true,
                  where: { project_id: options.where.project_id },
                  attributes: ['id', 'date_time'],
                }
              ],
            }
          ],
      },
    ],
  });
}

  async findById(id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findByPk(id);
  }

  // 🔎 Get Consultant By ProjectId
  async findByProjectIdConsultantId(project_id: number, consultant_id: number): Promise<ProjectConsultant | null> {
    return this.projectConsultantModel.findOne({ where: { project_id, consultant_id } ,paranoid: false, raw: true });
  }

  // 🔎 Get Consultant By ConsultantId
  async findByConsultantId(consultant_id: number): Promise<ProjectConsultant[]> {
    return this.projectConsultantModel.findAll({
      where: { consultant_id, deleted_at: null },
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
              as: 'projectDetails',
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

  // 🔎 Get ALL consultants of project (including soft deleted)
    async findAllByProjectIdWithDeleted(project_id: number,): Promise<ProjectConsultant[]> {
      return this.projectConsultantModel.findAll({
        where: { project_id },
        paranoid: false, 
        attributes: ['id', 'consultant_id', 'deleted_at'],
      });
    }

    async findOneByProjectAndConsultant(
  project_id: number,
  consultant_id: number,
) {
  return this.projectConsultantModel.findOne({
    where: { project_id, consultant_id },
    paranoid: false, // IMPORTANT
  });
}

async softDeleteNotIn(
  project_id: number,
  consultantIds: number[],
) {
  return this.projectConsultantModel.update(
    { deleted_at: new Date() },
    {
      where: {
        project_id,
        consultant_id: { [Op.notIn]: consultantIds },
        deleted_at: null,
      },
    },
  );
}

async findByProjectId(projectId: number) {
  return this.projectConsultantModel.findAll({
    where: {
      project_id: projectId,
      deleted_at: null,
    },
  });
}



}
