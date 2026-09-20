import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { Project } from 'models/project.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { ProjectTask } from 'models/project-task.model';
import { User } from 'models/user.model';
import { QueryTypes } from 'sequelize';
import { BadRequestException } from '@nestjs/common';
import { ProjectConsultant } from 'models/project-consultant.model';

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

  // Explicit milestone teams already have a payout bill. Track work separately.
  async createHourLog(data: Partial<ConsultantMonthlyBill>) {
    return this.model.sequelize.transaction(async transaction => {
      const project = await Project.findByPk(data.project_id, { transaction, lock: transaction.LOCK.UPDATE });
      const milestone = await ProjectMilestone.findByPk(data.milestone_id, { transaction, lock: transaction.LOCK.UPDATE });
      const assignment = await ProjectConsultant.findOne({
        where: { project_id: data.project_id, consultant_id: data.user_id, deleted_at: null }, transaction,
      });
      if (!project || project.deleted_at || !milestone || milestone.deleted_at ||
          Number(milestone.project_id) !== Number(data.project_id) || assignment?.status !== 'hired') {
        throw new BadRequestException('Only hired consultants can log hours on this project milestone');
      }
      if (data.task_id) {
        const task = await ProjectTask.findByPk(data.task_id, { transaction });
        if (!task || task.deleted_at || Number(task.project_id) !== Number(data.project_id) ||
            Number(task.project_milestone_id) !== Number(data.milestone_id)) {
          throw new BadRequestException('Task does not belong to this project milestone');
        }
      }
      if (!milestone.team_configured) return this.model.create(data as any, { transaction });
      const rows = await this.model.sequelize.query(`
        INSERT INTO consultant_hour_log(project_id,user_id,milestone_id,task_id,log_date,description,hours)
        VALUES(:project_id,:user_id,:milestone_id,:task_id,:log_date,:description,:hours)
        RETURNING *, 'timesheet:' || id AS id, 'timesheet' AS bill_type, 0 AS amount, false AS is_paid,
          to_char(log_date, 'YYYY-MM') AS month
      `, { replacements: { ...data, log_date: new Date(data.log_date).toISOString().slice(0, 10) }, transaction,
        type: QueryTypes.SELECT });
      return rows[0];
    });
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
    const legacy = await this.model.findAll({
      include: [
        { model: Project, required: false },
        { model: ProjectMilestone, required: false },
        { model: ProjectTask, required: false },
      ],
      where: { user_id: userId, bill_type: 'logged' },
      order: [['log_date', 'DESC'], ['id', 'DESC']],
    });
    const tracked = await this.model.sequelize.query(`
      SELECT l.*, 'timesheet:' || l.id AS id, 'timesheet' AS bill_type, 0 AS amount, false AS is_paid,
        to_char(l.log_date, 'YYYY-MM') AS month,
        to_jsonb(p) AS project, to_jsonb(m) AS milestone, to_jsonb(t) AS task
      FROM consultant_hour_log l
      LEFT JOIN project p ON p.id=l.project_id
      LEFT JOIN project_milestone m ON m.id=l.milestone_id
      LEFT JOIN project_task t ON t.id=l.task_id
      WHERE l.user_id=:userId
    `, { replacements: { userId }, type: QueryTypes.SELECT });
    return [...legacy.map(row => row.toJSON()), ...tracked].sort((a: any, b: any) =>
      new Date(b.log_date).getTime() - new Date(a.log_date).getTime()) as ConsultantMonthlyBill[];
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
