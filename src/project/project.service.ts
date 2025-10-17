import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ConsultantInterviewRepository } from '../../repository/consultant-interview.repository';
import { ProjectSummaryRepository } from '../../repository/project-summary.repository';
import { ProjectScopeOfWorkRepository } from '../../repository/project-scope-of-work.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectResponsibilityMatrixRepository } from '../../repository/project-responsibility-matrix.repository';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly consultantRepo: ProjectConsultantRepository,
    private readonly interviewRepo: ConsultantInterviewRepository,
    private readonly summaryRepo: ProjectSummaryRepository,
    private readonly scopeRepo: ProjectScopeOfWorkRepository,
    private readonly milestoneRepo: ProjectMilestoneRepository,
    private readonly responsibilityRepo: ProjectResponsibilityMatrixRepository,
  ) {}

  async createProject(data: CreateProjectDto) {
    return this.projectRepo.create(data);
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

  async addConsultant(data: any) {
    return this.consultantRepo.create(data);
  }

  async getConsultants(projectId: number) {
    return this.consultantRepo.findAll();
  }

  async scheduleInterview(data: any) {
    return this.interviewRepo.create(data);
  }

  async addSummary(data: any) {
    return this.summaryRepo.create(data);
  }

  async addScope(data: any) {
    return this.scopeRepo.create(data);
  }

  async addMilestone(data: any) {
    return this.milestoneRepo.create(data);
  }

  async addResponsibility(data: any) {
    return this.responsibilityRepo.create(data);
  }
}
