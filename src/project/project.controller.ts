import {Body,Controller,Delete,Get,Param,Post,Put, Req, UseGuards,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectConsultantDto, UpdateProjectConsultantStatusDto } from './dto/create-project-consultant.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConsultantStatus } from 'constant/enums';
import { CreateProjectTaskDto, UpdateProjectTaskDto } from './dto/project_task.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Initiate the project with client details' })
  createProject(@Req() req: any) {
    return this.projectService.createProject(req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiResponse({ status: 200, description: 'List of all projects' })
  findAll() {
    return this.projectService.getProjects();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  findOne(@Param('id') id: string) {
    return this.projectService.getProjectById(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiBody({ type: UpdateProjectDto })
  updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    console.log("if this runn")
    return this.projectService.updateProject(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  deleteProject(@Param('id') id: string) {
    return this.projectService.deleteProject(+id);
  }

  @Post(':id/consultants')
  @ApiOperation({ summary: 'Add consultant to a project' })
  @ApiBody({ type: CreateProjectConsultantDto })
  addConsultant(@Param('id') projectId: string, @Body() body: CreateProjectConsultantDto[]) {
    return this.projectService.addConsultant(body, +projectId );
  }

  @Get(':id/consultants')
  @ApiOperation({ summary: 'Get consultants for a project' })
  getConsultants(@Param('id') projectId: string) {
    return this.projectService.getProjectConsultants(+projectId);
  }

  @Put('consultant/status')
  @ApiOperation({ summary: 'Update project consultant status by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiBody({ type: UpdateProjectConsultantStatusDto })
  changeProjectConsultantStatus(@Body() body: UpdateProjectConsultantStatusDto) {
    return this.projectService.updateProjectConsultantStatus(body);
  }
  
  @Put('consultant/role')
  @ApiOperation({ summary: 'Update project consultant status by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiBody({ type: UpdateProjectConsultantStatusDto })
  changeProjectConsultantRole(@Body() body: UpdateProjectConsultantStatusDto) {
    return this.projectService.updateProjectConsultantRole(body);
  }

  @Get(':id/consultants_to_hired')
  @ApiOperation({ summary: 'Get consultants for a project' })
  getToBeHiredConsultants(@Param('id') projectId: string) {
    return this.projectService.getProjectConsultants(+projectId, [ConsultantStatus.HIRED, ConsultantStatus.INTERVIEW_SCHEDULED, ConsultantStatus.REJECTED]);
  }


  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  addMilestone(@Param('id') projectId: string, @Body() body: CreateProjectMilestoneDto) {
    return this.projectService.addMilestone({ ...body, project_id: +projectId });
  }
  
  @Put('milestones/:id')
  @ApiOperation({ summary: 'Update project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  updateMilestone(@Param('id') milestone_id: string, @Body() body: CreateProjectMilestoneDto) {
    return this.projectService.updateMilestone(+milestone_id, body);
  }
   @Post('milestones/:milestoneId/tasks')
  @ApiOperation({ summary: 'Add task under milestone' })
  @ApiBody({ type: CreateProjectTaskDto })
  addTask(
    @Param('milestoneId') milestoneId: string,
    @Body() body: CreateProjectTaskDto,
  ) {
    return this.projectService.createTask(+milestoneId, body);
  }

  @Put('tasks/:taskId')
  @ApiOperation({ summary: 'Update task (relocate supported)' })
  @ApiBody({ type: UpdateProjectTaskDto })
  updateTask(
    @Param('taskId') taskId: string,
    @Body() body: UpdateProjectTaskDto,
  ) {
    return this.projectService.updateTask(+taskId, body);
  }

  @Get('milestones/:milestoneId/tasks')
  @ApiOperation({ summary: 'Get all tasks under a milestone' })
  getTasks(@Param('milestoneId') milestoneId: string) {
    return this.projectService.getTaskByMilestone(+milestoneId);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get single task by ID' })
  getTask(@Param('taskId') taskId: string) {
    return this.projectService.getTaskById(+taskId);
  }

  @Delete('milestones/:milestoneId')
  @ApiOperation({ summary: 'Delete milestone by ID' })
  @ApiResponse({ status: 200, description: 'Milestone deleted successfully' })
  deleteMilestone(@Param('milestoneId') milestoneId: string) {
    return this.projectService.deleteMilestone(+milestoneId);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  deleteTask(@Param('taskId') taskId: string) {
    return this.projectService.deleteTask(+taskId);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'Get project payments' })
  getProjectPayments(@Param('id') id: string) {
    return this.projectService.getProjectPayments(+id);
  }
}
