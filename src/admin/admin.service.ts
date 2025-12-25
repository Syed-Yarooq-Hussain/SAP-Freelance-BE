import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepository } from 'repository/user.repository';
import { getAdminsClientResponse, getAdminsConsultantResponse, getAdminsProjectResponse } from './transformer/response.transformer';
import { ProjectRepository } from 'repository/project.repository';

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


  async getAllConsultant(status: string) {
    const consultantList =  await this.userRepo.findAllUsersWithConsultants(status);
    let consultants = getAdminsConsultantResponse(consultantList);
    return consultants;
  }

  async accpetRejectConsultantById(id: number, body: any) {
    const consultant = await this.userRepo.findById(id);

    if (!consultant) {
      throw new Error('Consultant not found');
    }
    consultant.status = body.status;
    await consultant.save();
    return consultant;
  }
  
  async getAllClients(status: string) {
    let clientsResponse = await this.userRepo.getAllClientsWithProjectstatus(status);
    return getAdminsClientResponse(clientsResponse);
  }
  
  async getAllProjects() {
    let projects = await this.projectRepo.findAllforAdmin();
    return getAdminsProjectResponse(projects);
  }
}
