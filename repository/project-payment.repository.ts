import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProjectPayment } from '../models/project-payment.model';
import { Project } from 'models/project.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { Document } from 'models/document.model';
import { User } from 'models/user.model';

@Injectable()
export class ProjectPaymentRepository {
  constructor(
    @InjectModel(ProjectPayment)
    private readonly projectPaymentModel: typeof ProjectPayment,
  ) {}

  // 🆕 Create Payment Record
  async create(data: Partial<ProjectPayment>): Promise<ProjectPayment> {
    return this.projectPaymentModel.create(data);
  }

  // 📋 Get All Payments (With Optional Filter)
  async findAll(options?: any): Promise<any[]> {
    return this.projectPaymentModel.findAll({
      include: [
        {
          model: Project,
          as: 'project',
          required: false,
        },
        {
          model: ProjectMilestone,
          as: 'milestone',
          required: false,
        },
      ],
      ...options,
    });
  }

  // 🔍 Get Payment By Id
  async findById(id: number): Promise<ProjectPayment | null> {
    return this.projectPaymentModel.findByPk(id);
  }

  // 🔎 Get Payments By Project Id
  async projectPaymentsByClientId(client_id: number): Promise<ProjectPayment[] | null> {
    return this.projectPaymentModel.findAll({
      include: [
        {
          model: Project,
          as: 'project', 
          where: { client_id },
        },
        {
          model: ProjectMilestone,
          as: 'milestone',
          required: false,
        },
        {
          model: Document,
          required: false,
        }
      ],
      raw: true,
      nest: true,
    });
  }

  // 🧠 Update Payment Record
  async findAllForAdmin(): Promise<ProjectPayment[]> {
    return this.projectPaymentModel.findAll({
      include: [
        {
          model: Project,
          as: 'project',
          required: false,
          include: [
            {
              model: User,
              as: 'client',
              attributes: ['id', 'username', 'email', 'status'],
            },
          ],
        },
        {
          model: ProjectMilestone,
          as: 'milestone',
          required: false,
        },
        {
          model: Document,
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
  }

  async update(
    id: number,
    data: Partial<ProjectPayment>,
  ): Promise<[number, ProjectPayment[]]> {
    return this.projectPaymentModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Payment Record
  async delete(id: number): Promise<number> {
    return this.projectPaymentModel.destroy({ where: { id } });
  }

  async existsByMilestoneId(milestoneId: number): Promise<boolean> {
  const count = await this.projectPaymentModel.count({
    where: {
      project_milestone_id: milestoneId,
      deleted_at: null,
    },
  });

  return count > 0;
}

async hasPaidByMilestoneId(milestoneId: number): Promise<boolean> {
  const count = await this.projectPaymentModel.count({
    where: {
      project_milestone_id: milestoneId,
      is_paid: true,
      deleted_at: null,
    },
  });

  return count > 0;
}

async deleteUnpaidByMilestoneId(milestoneId: number): Promise<void> {
  await this.projectPaymentModel.destroy({
    where: {
      project_milestone_id: milestoneId,
      is_paid: false,
    },
  });
}

}
