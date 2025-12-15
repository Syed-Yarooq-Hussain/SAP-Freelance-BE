import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepository } from 'repository/user.repository';
import { getAdminsClientResponse } from './transformer/response.transformer';
import { ProjectRepository } from 'repository/project.repository';
import { transformProjectConsultant } from 'src/project/transformers/project-consultant-transformer';

@Injectable()
export class AdminService {
  constructor(
    private userRepo: UserRepository,
    private projectRepo: ProjectRepository,
  ) {}

  async dashboardStatistic() {
    return {
        total_consultants: 150,
        total_clients: 45,
        active_consultants: 120,
        active_clients: 40,
        active_projects: 30,
        upcoming_projects: 15,
        pending_consultant_approvals: 5,
        interview_this_week: 20,
    }
  }


  async getAllConsultant() {
    return await this.userRepo.findAllUsersWithConsultants();
  }
  
  async getAllClients() {
    let clientsResponse = await this.userRepo.getAllClientsWithProjectstatus();
    return getAdminsClientResponse(clientsResponse);
  }
  
  async getAllProjects() {
    return await this.projectRepo.findAllforAdmin();
  }




}
