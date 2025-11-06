import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ProjectIndustriesRepository } from '../../repository/project-indestries.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectPaymentRepository } from '../../repository/project-payment.repository';
import { ProjectTaskRepository } from '../../repository/project-task.repository';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRepository } from 'repository/user.repository';
import { CreateProjectConsultantDto } from './dto/create-project-consultant.dto';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly consultantRepo: ProjectConsultantRepository,
    private readonly industryRepo: ProjectIndustriesRepository,
    private readonly milestoneRepo: ProjectMilestoneRepository,
    private readonly paymentRepo: ProjectPaymentRepository,
    private readonly taskRepo: ProjectTaskRepository,
    private readonly userRepo: UserRepository,
  ) {}

  async createProject(user: any) {
    return await this.projectRepo.create({ 
      client_id: user.id,
      name: `New Project for ${user?.name || 'Client'}`,
      company_name: 'Unknown Company',
      status: 'Initiated',

     });
  }

  async getProjects() {
    return this.projectRepo.findAll();
  }

  async getProjectById(id: number) {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  async updateProject(id: number, updateData: UpdateProjectDto) {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.projectRepo.update(id, updateData);
  }

  async deleteProject(id: number) {
    const project = await this.projectRepo.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return this.projectRepo.delete(id);
  }

  async addConsultant(data: CreateProjectConsultantDto[], project_id: number) {
    try {
      for (const item of data) {
      let projectConsultant = {
        ...item,
        project_id,
        status: 'shortlisted',
        decided_rate: 0,
        booking_schedules: null,
        is_joic_signed: false,
      }

      await this.consultantRepo.create(projectConsultant); 
      //Todo: send email to consultant about being added to project

    }
    return { message: 'Consultants added successfully', data };
    } catch (error) {
      throw error;
    }
    
  }

  async getProjectConsultants(projectId: number) {
    return this.consultantRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async addIndustry(data: any) {
    return this.industryRepo.create(data);
  }

  async getProjectIndustries(projectId: number) {
    return this.industryRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async addMilestone(data: any) {
    return this.milestoneRepo.create(data);
  }

  async getProjectMilestones(projectId: number) {
    return this.milestoneRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async addPayment(data: any) {
    return this.paymentRepo.create(data);
  }

  async getProjectPayments(projectId: number) {
    return this.paymentRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async addTask(data: any) {
    return this.taskRepo.create(data);
  }

  async getProjectTasks(projectId: number) {
    return this.taskRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async scheduleInterview(data: any) {
   return { message: 'Interview scheduled (mock response)', data };
  }

  async getTasksByMilestone(milestoneId: number) {
    return this.taskRepo.findAll({
      where: { milestone_id: milestoneId },
    });
  }

}
