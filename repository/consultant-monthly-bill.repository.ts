import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { Project } from 'models/project.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { ProjectTask } from 'models/project-task.model';
import { User } from 'models/user.model';

@Injectable()
export class ConsultantMonthlyBillRepository {
  constructor(
    @InjectModel(ConsultantMonthlyBill)
    private readonly model: typeof ConsultantMonthlyBill,
  ) {}

  async deleteUnpaidByMilestoneId(milestoneId: number): Promise<void> {
    await this.model.destroy({
      where: { milestone_id: milestoneId, is_paid: false, bill_type: 'auto' },
    });
  }

  async create(data: Partial<ConsultantMonthlyBill>): Promise<ConsultantMonthlyBill> {
    return this.model.create(data as any);
  }

  async findByProjectAndConsultant(
    projectId: number,
    userId: number,
  ): Promise<ConsultantMonthlyBill[]> {
    return this.model.findAll({
      include: [
        { model: ProjectMilestone, required: false },
        { model: ProjectTask, required: false },
      ],
      where: { project_id: projectId, user_id: userId },
      order: [['month', 'ASC'], ['id', 'ASC']],
    });
  }
  
  async findByConsultant(
    userId: number,
  ): Promise<ConsultantMonthlyBill[]> {
    return this.model.findAll({
      include: [
        {
          model:Project,
        },
        {
          model: ProjectMilestone,
          required: false,
        },
        {
          model: ProjectTask,
          required: false,
        },
      ],
      where: {  user_id: userId },
      order: [['month', 'ASC'], ['id', 'ASC']],
    });
  }

  async findById(id: number): Promise<ConsultantMonthlyBill | null> {
    return this.model.findByPk(id, {
      include: [
        { model: Project, required: false },
        { model: ProjectMilestone, required: false },
        { model: ProjectTask, required: false },
        { model: User, required: false, attributes: ['id', 'username', 'email', 'status'] },
      ],
    });
  }

  async findHourLogsByConsultant(
    userId: number,
  ): Promise<ConsultantMonthlyBill[]> {
    return this.model.findAll({
      include: [
        { model: Project, required: false },
        { model: ProjectMilestone, required: false },
        { model: ProjectTask, required: false },
      ],
      where: { user_id: userId, bill_type: 'logged' },
      order: [['log_date', 'DESC'], ['id', 'DESC']],
    });
  }

  async findByProject(projectId: number): Promise<ConsultantMonthlyBill[]> {
    return this.model.findAll({
      where: { project_id: projectId },
      order: [['month', 'ASC'], ['user_id', 'ASC']],
    });
  }

  async findAllForAdmin(): Promise<ConsultantMonthlyBill[]> {
    return this.model.findAll({
      include: [
        {
          model: Project,
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
          required: false,
        },
        {
          model: ProjectTask,
          required: false,
        },
        {
          model: User,
          required: false,
          attributes: ['id', 'username', 'email', 'status'],
        },
      ],
      order: [['id', 'DESC']],
      raw: true,
      nest: true,
    });
  }

  async markPaid(id: number, pdfUrl: string): Promise<void> {
    await this.model.update(
      { is_paid: true, pdf_url: pdfUrl },
      { where: { id } },
    );
  }
}
