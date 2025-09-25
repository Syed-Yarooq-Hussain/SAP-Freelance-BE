import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateProjectConsultantDto } from './dto/create-project-consultant.dto';
import { CreateConsultantInterviewDto } from './dto/create-consultant-interview.dto';
import { CreateProjectSummaryDto } from './dto/create-project-summary.dto';
import { CreateProjectScopeDto } from './dto/create-project-scope.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { CreateProjectResponsibilityDto } from './dto/create-project-responsibility.dto';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // Project
  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectService.createProject(dto);
  }

  @Get()
  findAll() {
    return this.projectService.getProjects();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.projectService.getProjectById(id);
  }

  // Consultants
  @Post(':id/consultants')
  addConsultant(@Param('id') projectId: number, @Body() dto: CreateProjectConsultantDto) {
    return this.projectService.addConsultant({ ...dto, project_id: projectId });
  }

  @Get(':id/consultants')
  getConsultants(@Param('id') projectId: number) {
    return this.projectService.getConsultants(projectId);
  }

  // Interviews
  @Post(':id/interviews')
  scheduleInterview(@Param('id') projectId: number, @Body() dto: CreateConsultantInterviewDto) {
    return this.projectService.scheduleInterview({ ...dto, project_id: projectId });
  }

  // Summary
  @Post(':id/summary')
  addSummary(@Param('id') projectId: number, @Body() dto: CreateProjectSummaryDto) {
    return this.projectService.addSummary({ ...dto, project_id: projectId });
  }

  // Scope
  @Post(':id/scopes')
  addScope(@Param('id') projectId: number, @Body() dto: CreateProjectScopeDto) {
    return this.projectService.addScope({ ...dto, project_id: projectId });
  }

  // Milestones
  @Post(':id/milestones')
  addMilestone(@Param('id') projectId: number, @Body() dto: CreateProjectMilestoneDto) {
    return this.projectService.addMilestone({ ...dto, project_id: projectId });
  }

  // Responsibilities
  @Post(':id/responsibilities')
  addResponsibility(@Param('id') projectId: number, @Body() dto: CreateProjectResponsibilityDto) {
    return this.projectService.addResponsibility({ ...dto, project_id: projectId });
  }
}
