import { ValidationPipe } from '@nestjs/common';
import { MilestoneTeamService } from './milestone-team.service';
import { SaveMilestoneTeamDto } from './dto/milestone-team.dto';
import { SaveTeamBuilderDto, teamBuilderResponseSchema } from './dto/team-builder.dto';
import {Body,Controller,Delete,Get,Param,Post,Put, Query, Req, UploadedFile, UseGuards, UseInterceptors, BadRequestException,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectService } from './project.service';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectConsultantDto, UpdateProjectConsultantRoleDto, UpdateProjectConsultantStatusDto } from './dto/create-project-consultant.dto';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { UpdateProjectPaymentDto } from './dto/update-project-payment.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ConsultantStatus } from 'constant/enums';
import { CreateProjectTaskDto, UpdateProjectTaskDto } from './dto/project_task.dto';
import { GetConsultantsQueryDto } from './dto/get-query.dto';
import { UploadProjectDocumentDto } from './dto/upload-project-document.dto';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'constant/enums';
import { InitiateProjectDto } from './dto/initiate-project.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService,
    private readonly milestoneTeam: MilestoneTeamService) {}

  @Get(':projectId/milestones/:milestoneId/team')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  getMilestoneTeam(@Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string, @Req() req: any) {
    return this.milestoneTeam.get(Number(projectId), Number(milestoneId), req.user);
  }

  @Put(':projectId/milestones/:milestoneId/team')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiBody({ type: SaveMilestoneTeamDto })
  saveMilestoneTeam(@Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: SaveMilestoneTeamDto,
    @Req() req: any) {
    return this.milestoneTeam.save(Number(projectId), Number(milestoneId), dto, req.user);
  }
  
  @Get(':id/team-builder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Load the complete persisted team builder snapshot' })
  @ApiResponse({ status: 200, schema: teamBuilderResponseSchema })
  getTeamBuilder(@Param('id') id: string, @Req() req: any) {
    return this.projectService.getTeamBuilder(Number(id), req.user);
  }

  @Put(':id/team-builder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atomically replace members, hours and proposed positions' })
  @ApiResponse({ status: 200, schema: teamBuilderResponseSchema })
  @ApiResponse({ status: 409, description: 'Stale revision or protected membership; reload or use the explicit workflow' })
  @ApiBody({ type: SaveTeamBuilderDto })
  saveTeamBuilder(@Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) dto: SaveTeamBuilderDto,
    @Req() req: any) {
    return this.projectService.saveTeamBuilder(Number(id), dto, req.user);
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Initiate the project with client details' })
  @ApiBody({ type: InitiateProjectDto })
  createProject(@Body() body: InitiateProjectDto, @Req() req: any) {
    return this.projectService.createProject(req.user, body || {});
  }

  @Get('milestones/:milestoneId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get milestone by ID' })
  @ApiResponse({ status: 200, description: 'Milestone details' })
  getMilestoneById(
    @Param('milestoneId') milestoneId: string,
    @Req() req: any,
  ) {
    return this.projectService.getMilestoneById(+milestoneId, req.user);
  }

  @Get(':id(\\d+)')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.projectService.getProjectById(+id, req.user);
  }

  @Put(':id(\\d+)')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiBody({ type: UpdateProjectDto })
  updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: any) {
    return this.projectService.updateProject(+id, dto, req.user);
  }

  @Delete(':id(\\d+)')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete project by ID' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  deleteProject(@Param('id') id: string, @Req() req: any) {
    return this.projectService.deleteProject(+id, req.user);
  }

  @Post(':id/consultants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add consultant to a project' })
  @ApiBody({ type: CreateProjectConsultantDto })
  addConsultant(@Param('id') projectId: string, @Body() body: CreateProjectConsultantDto[], @Req() req: any) {
    return this.projectService.addConsultant(body, +projectId, req.user);
  }

  @Put(':id/consultants/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  syncConsultants(@Param('id') projectId: string, @Body() body: CreateProjectConsultantDto[], @Req() req: any) {
    return this.projectService.syncConsultants(body, +projectId, req.user);
  }

  @Delete(':projectId/consultants/:consultantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  removeConsultant(@Param('projectId') projectId: string, @Param('consultantId') consultantId: string, @Req() req: any) {
    return this.projectService.removeConsultant(+projectId, +consultantId, req.user);
  }

  @Post('documents/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.CONSULTANT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a project document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'project_id', 'user_id', 'type'],
      properties: {
        file: { type: 'string', format: 'binary' },
        project_id: { type: 'number' },
        user_id: { type: 'number' },
        type: { type: 'string' },
      },
    },
  })
  uploadProjectDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadProjectDocumentDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File required');
    }

    return this.projectService.uploadProjectDocument(body, file, req.user);
  }

  @Post(':id/documents/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.CONSULTANT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a document linked to a project' })
  @ApiConsumes('multipart/form-data')
  uploadProjectDocumentByProject(
    @Param('id') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadProjectDocumentDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File required');
    }

    return this.projectService.uploadProjectDocument(
      { ...body, project_id: +projectId },
      file,
      req.user,
    );
  }

  @Get(':id/consultants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get consultants for a project' })
  getConsultants(@Param('id') projectId: string, @Query() query: GetConsultantsQueryDto, @Req() req: any) {
    return this.projectService.getProjectConsultants(+projectId, query, req.user);
  }

  @Put('consultant/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project consultant status by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiBody({ type: UpdateProjectConsultantStatusDto })
  changeProjectConsultantStatus(@Body() body: UpdateProjectConsultantStatusDto, @Req() req: any) {
    return this.projectService.updateProjectConsultantStatus(body, req.user);
  }
  
  @Put('consultant/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project consultant status by ID' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiBody({ type: UpdateProjectConsultantRoleDto })
  changeProjectConsultantRole(@Body() body: UpdateProjectConsultantRoleDto, @Req() req: any) {
    return this.projectService.updateProjectConsultantRole(body, req.user);
  }

  @Get(':id/consultants_to_hired')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get consultants for a project' })
  getToBeHiredConsultants(@Param('id') projectId: string, @Req() req: any) {
    let query: GetConsultantsQueryDto = {
      status : `${ConsultantStatus.HIRED},${ConsultantStatus.OFFERED},${ConsultantStatus.SHORTLISTED},${ConsultantStatus.INTERVIEW_SCHEDULED},${ConsultantStatus.INTERVIEW_DONE}`
    }
    return this.projectService.getProjectConsultants(+projectId, query, req.user);
  }


  @Post(':id/milestones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  addMilestone(@Param('id') projectId: string, @Body() body: CreateProjectMilestoneDto, @Req() req: any) {
    return this.projectService.addMilestone({ ...body, project_id: +projectId }, req.user);
  }

  @Get(':id/milestones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  getProjectMilestone(@Param('id') projectId: string, @Req() req: any) {
    return this.projectService.getMilestonesByProject(+projectId, req.user);
  }
  
  @Get(':id/payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  getProjectPayments(@Param('id') projectId: string, @Req() req: any) {
    return this.projectService.getPaymentsByProject(+projectId, req.user);
  }

  @Put('payments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project payment' })
  @ApiResponse({ status: 200, description: 'Project payment updated successfully' })
  @ApiBody({ type: UpdateProjectPaymentDto })
  updateProjectPayment(
    @Param('id') paymentId: string,
    @Body() body: UpdateProjectPaymentDto,
    @Req() req: any,
  ) {
    return this.projectService.updatePayment(+paymentId, body, req.user);
  }
  
  @Put('milestones/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update project milestone' })
  @ApiBody({ type: CreateProjectMilestoneDto })
  updateMilestone(@Param('id') milestone_id: string, @Body() body: CreateProjectMilestoneDto, @Req() req: any) {
    return this.projectService.updateMilestone(+milestone_id, body, req.user);
  }
   @Post('milestones/:milestoneId/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Add task under milestone' })
  @ApiBody({ type: CreateProjectTaskDto })
  addTask(
    @Param('milestoneId') milestoneId: string,
    @Body() body: CreateProjectTaskDto,
    @Req() req: any,
  ) {
    return this.projectService.createTask(+milestoneId, body, req.user);
  }

  @Put('tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update task (relocate supported)' })
  @ApiBody({ type: UpdateProjectTaskDto })
  updateTask(
    @Param('taskId') taskId: string,
    @Body() body: UpdateProjectTaskDto,
    @Req() req: any,
  ) {
    return this.projectService.updateTask(+taskId, body, req.user);
  }

  @Get('milestones/:milestoneId/tasks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all tasks under a milestone' })
  getTasks(@Param('milestoneId') milestoneId: string, @Req() req: any) {
    return this.projectService.getTaskByMilestone(+milestoneId, req.user);
  }

  @Get('tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get single task by ID' })
  getTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.projectService.getTaskById(+taskId, req.user);
  }

  @Delete('milestones/:milestoneId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete milestone by ID' })
  @ApiResponse({ status: 200, description: 'Milestone deleted successfully' })
  deleteMilestone(@Param('milestoneId') milestoneId: string, @Req() req: any) {
    return this.projectService.deleteMilestone(+milestoneId, req.user);
  }

  @Delete('tasks/:taskId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  deleteTask(@Param('taskId') taskId: string, @Req() req: any) {
    return this.projectService.deleteTask(+taskId, req.user);
  }

  @Get('project/:projectId/consultant/:userId/monthly-bills')
  @UseGuards(JwtAuthGuard)
  getMonthlyBills(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.projectService.getConsultantMonthlyBills(+projectId, +userId, req.user);
  }
}
