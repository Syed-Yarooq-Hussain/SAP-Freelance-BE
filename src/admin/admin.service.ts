import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserRepository } from 'repository/user.repository';
import { getAdminsClientResponse, getAdminsConsultantResponse, getAdminsProjectResponse } from './transformer/response.transformer';
import { ProjectRepository } from 'repository/project.repository';
import { IndustriesRepository } from 'repository/indutries.repository';

@Injectable()
export class AdminService {
  constructor(
    private userRepo: UserRepository,
    private projectRepo: ProjectRepository,
    private industriesRepo: IndustriesRepository,
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

  // 🏭 Industries CRUD Operations
  async createIndustry(name: string) {
    const newIndustry = await this.industriesRepo.create({ name });
    return {
      message: 'Industry created successfully',
      data: newIndustry
    };
  }

  async getAllIndustries() {
    const industries = await this.industriesRepo.findAll();
    return {
      message: 'Industries fetched successfully',
      data: industries
    };
  }

  async getIndustryById(id: number) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      throw new Error('Industry not found');
    }
    return {
      message: 'Industry fetched successfully',
      data: industry
    };
  }

  async updateIndustry(id: number, name: string) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      throw new Error('Industry not found');
    }
    const [, updatedIndustries] = await this.industriesRepo.update(id, { name });
    return {
      message: 'Industry updated successfully',
      data: updatedIndustries[0]
    };
  }

  async deleteIndustry(id: number) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      throw new Error('Industry not found');
    }
    const deletedCount = await this.industriesRepo.delete(id);
    return {
      message: 'Industry deleted successfully',
      deletedCount
    };
  }
}
