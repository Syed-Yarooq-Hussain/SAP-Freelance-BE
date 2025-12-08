import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../models/project.model';
import { ProjectPayment } from 'models/project-payment.model';

@Injectable()
export class ProjectRepository {
  constructor(
    @InjectModel(Project)
    private readonly projectModel: typeof Project,
  ) {}

  // Add new project
  async create(data: Partial<Project>): Promise<Project> {
    return this.projectModel.create(data);
  }

  // Get all projects
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

  // 🔎 Project by ID
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

  // 🔎 Client ID  projects
  async findByClientId(client_id: number): Promise<Project[]> {
    return this.projectModel.findAll({ where: { client_id } });
  }

  // 🧠 Project update 
  async update(
    id: number,
    data: Partial<Project>,
  ): Promise<[number, Project[]]> {
    return this.projectModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Project delete karne ke liye
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

}
