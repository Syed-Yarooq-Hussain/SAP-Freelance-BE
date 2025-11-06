import {Body,Controller,Delete,Get,Param,Post,Put, Req, UseGuards,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectConsultantDto } from './dto/create-project-consultant.dto';
import { CreateConsultantInterviewDto } from './dto/create-consultant-interview.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

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

  @Post(':id/interviews')
  @ApiOperation({ summary: 'Schedule consultant interview for project' })
  @ApiBody({ type: CreateConsultantInterviewDto })
  scheduleInterview(@Param('id') projectId: string, @Body() dto: CreateConsultantInterviewDto) {
    return this.projectService.scheduleInterview({ ...dto, project_id: +projectId });
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  addMilestone(@Param('id') projectId: string, @Body() dto: CreateProjectMilestoneDto) {
    return this.projectService.addMilestone({ ...dto, project_id: +projectId });
  }

}
