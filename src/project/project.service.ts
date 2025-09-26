import { Injectable } from '@nestjs/common';

import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ConsultantInterviewRepository } from '../../repository/consultant-interview.repository';
import { ProjectSummaryRepository } from '../../repository/project-summary.repository';
import { ProjectScopeOfWorkRepository } from '../../repository/project-scope-of-work.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectResponsibilityMatrixRepository } from '../../repository/project-responsibility-matrix.repository';
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

  // 🔹 Project
  createProject(data: any) {
    return this.projectRepo.create(data);
  }
  getProjects() {
    return this.projectRepo.findAll();
  }
  getProjectById(id: number) {
    return this.projectRepo.findById(id);
  }

  // 🔹 Consultants
  addConsultant(data: any) {
    return this.consultantRepo.create(data);
  }
  getConsultants(projectId: number) {
    return this.consultantRepo.findAll();
  }

  // 🔹 Interviews
  scheduleInterview(data: any) {
    return this.interviewRepo.create(data);
  }

  // 🔹 Summary
  addSummary(data: any) {
    return this.summaryRepo.create(data);
  }

  // 🔹 Scope
  addScope(data: any) {
    return this.scopeRepo.create(data);
  }

  // 🔹 Milestone
  addMilestone(data: any) {
    return this.milestoneRepo.create(data);
  }

  // 🔹 Responsibility
  addResponsibility(data: any) {
    return this.responsibilityRepo.create(data);
  }
}
