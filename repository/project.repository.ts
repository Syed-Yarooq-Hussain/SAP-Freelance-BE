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
  async create(data: Partial<Project>): Promise<Project> {
    return this.projectModel.create(data);
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
  async findById(id: number): Promise<Project | null> {
    return this.projectModel.findByPk(id, {
      include: [
      {
        association: 'projectDetails', 
        
      },{
        association: 'client',
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
  ): Promise<[number, Project[]]> {
    return this.projectModel.update(data, {
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
          attributes: ['username'],
        }
      ],
      raw: true,
      nest: true,
    });
  }

}
