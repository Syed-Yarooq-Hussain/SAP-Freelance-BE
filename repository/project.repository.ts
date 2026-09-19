import { literal, ProjectionAlias } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../models/project.model';
import { ProjectPayment } from 'models/project-payment.model';
import { User } from 'models/user.model';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  // 🆕 Create Project
  async create(data: Partial<Project>, transaction: any = null): Promise<Project> {
    return this.projectModel.create(data, {transaction});
  }

  // 📋 Get All Projects
  async findAllByClient(user_id: number): Promise<Project[]> {
    return this.projectModel.findAll({
      where: { client_id: user_id },
      include: [
        'projectDetails',
      ],
      raw: true,
      nest: true,
    });
  }

  // 🔍 Get Project By Id
  async findById(id: number, transaction?: any): Promise<Project | null> {
    return this.projectModel.findByPk(id, {
      transaction,
      attributes: { include: [[literal(`(
        SELECT jsonb_build_object(
          'unconfigured_milestones',(SELECT count(*) FROM project_milestone WHERE project_id="Project".id AND deleted_at IS NULL AND NOT team_configured),
          'by_currency',COALESCE((SELECT jsonb_agg(totals) FROM (
            SELECT team_currency AS currency,sum(team_estimated_amount) AS estimated_amount,sum(team_payable_amount) AS payable_amount
            FROM project_milestone WHERE project_id="Project".id AND deleted_at IS NULL AND team_configured GROUP BY team_currency
          ) totals),'[]'::jsonb))
      )`), 'milestone_billing'] as ProjectionAlias] },
      include: [
      {
        association: 'projectDetails', 
        
      },{
        association: 'client',
        attributes: ['id', 'username', 'email', 'status', 'profit_margin_percentage'],
      }], 
      raw: false
    });
  }

  // 🔎 Get Project By Client Id
  async findByClientId(client_id: number): Promise<Project[]> {
    return this.projectModel.findAll({ where: { client_id } });
  }

  // 🧠 Update Project 
  async update(
    id: number,
    data: Partial<Project>,
    transaction?: import('sequelize').Transaction,
  ): Promise<[number, Project[]]> {
    return this.projectModel.update(data, {
      transaction,
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Project
  async delete(id: number): Promise<number> {
    return this.projectModel.destroy({ where: { id } });
  }

  async projectPaymentsByClientId(client_id: number): Promise<Project[] | null> {
    return this.projectModel.findAll({
      where: { client_id },
      include: [
        {
          model: ProjectPayment,
          as: 'payments',
        },
      ],
    });
  }

  async findAllforAdmin(): Promise<Project[]> {
    return this.projectModel.findAll({
      include: [
        'projectDetails',
        {
          model: User,
          as: 'client',
          attributes: ['username'],
        }
      ],
      raw: true,
      nest: true,
    });
  }

}
