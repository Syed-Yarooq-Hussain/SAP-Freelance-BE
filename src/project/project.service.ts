import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ProjectIndustriesRepository } from '../../repository/project-indestries.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectPaymentRepository } from '../../repository/project-payment.repository';
import { ProjectTaskRepository } from '../../repository/project-task.repository';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UserRepository } from 'repository/user.repository';
import { CreateProjectConsultantDto, UpdateProjectConsultantStatusDto } from './dto/create-project-consultant.dto';
import { ConsultantStatus } from 'constant/enums';
import { Op } from 'sequelize';
import { ProjectDetailRepository } from 'repository/project-detail.repository';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import { CreateProjectTaskDto, UpdateProjectTaskDto } from './dto/project_task.dto';
import { ProjectTask } from 'models/project-task.model';
import { ProjectMilestone } from 'models/project-milestone.model';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly projectConsultantRepo: ProjectConsultantRepository,
    private readonly industryRepo: ProjectIndustriesRepository,
    private readonly milestoneRepo: ProjectMilestoneRepository,
    private readonly paymentRepo: ProjectPaymentRepository,
    private readonly taskRepo: ProjectTaskRepository,
    private readonly projectDetailrepository: ProjectDetailRepository,
    private readonly projectTaskRepo: ProjectTaskRepository,
  ) { }

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
    project.name = updateData.name ?? project.name;
    project.company_name = updateData.company_name ?? project.company_name;
    project.status = updateData.status ?? project.status;
    await this.projectRepo.update(id, project);

    const existingProjectDetail = await this.projectDetailrepository.findByProjectId(id);

    const projectDetailpayload = {
      project_id: id,
      start_date: updateData.start_date ?? existingProjectDetail?.start_date ?? null,
      end_date: updateData.end_date ?? existingProjectDetail?.end_date ?? null,
      duration: updateData.duration ?? existingProjectDetail?.duration ?? null,
      cost: updateData.cost ?? existingProjectDetail?.cost ?? 0,
      paid_amount: updateData.paid_amount ?? existingProjectDetail?.paid_amount ?? 0,
    };

    existingProjectDetail ? await this.projectDetailrepository.update(id, projectDetailpayload)
      : await this.projectDetailrepository.create(projectDetailpayload);

    return {
      ...project,
      projectDetail: projectDetailpayload
    }

  }

  async updateProjectConsultantStatus(body: UpdateProjectConsultantStatusDto) {
    let IsConsultantExist = await this.projectConsultantRepo.findByProjectIdConsultantId(body.project_id, body.consultant_id);
    if (!IsConsultantExist) {
      throw new NotFoundException(`Consultant with ID ${body.consultant_id} not found in project ID ${body.project_id}`);
    }
    if (body.status == ConsultantStatus.HIRED) {
      //Todo: send NDA 
      //Todo: send email
      //set user role as well 
    } else if (body.status == ConsultantStatus.REJECTED) {
      //Todo: send rejection email
    }
    return await this.projectConsultantRepo.update(IsConsultantExist.id, { status: body.status });

  }

  async updateProjectConsultantRole(body: UpdateProjectConsultantStatusDto) {
    let IsConsultantExist = await this.projectConsultantRepo.findByProjectIdConsultantId(body.project_id, body.consultant_id);
    if (!IsConsultantExist) {
      throw new NotFoundException(`Consultant with ID ${body.consultant_id} not found in project ID ${body.project_id}`);
    }
    return await this.projectConsultantRepo.update(IsConsultantExist.id, { role: body.role });
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

        await this.projectConsultantRepo.create(projectConsultant);
        //Todo: send email to consultant about being added to project

      }
      return { message: 'Consultants added successfully', data };
    } catch (error) {
      throw error;
    }

  }

  async getProjectConsultants(projectId: number, status: string[] = ['shortlisted']) {
    return this.projectConsultantRepo.findAll({
      where: { project_id: projectId, status: { [Op.in]: status } },
    });
  }

  async getProjectIndustries(projectId: number) {
    return this.industryRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async addMilestone(data: CreateProjectMilestoneDto) {
    return this.milestoneRepo.create(data);
  }

  async updateMilestone(id: number, data: CreateProjectMilestoneDto) {
    let isMMilestoneExist = await this.milestoneRepo.findById(id);
    if (!isMMilestoneExist) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }
    return this.milestoneRepo.update(id, data);
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

  
  
  
  
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX      TASK   XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  // 🆕 CREATE TASK (always under milestone)
  async createTask(
    milestoneId: number,
    dto: CreateProjectTaskDto,
  ): Promise<ProjectTask> {
    console.log(dto)
    if (!dto.name?.trim()) {
      throw new BadRequestException('Task name is required');
    }

    const milestone = await this.milestoneRepo.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    const data: Partial<ProjectTask> = {
      ...dto,
      project_milestone_id: milestoneId,
      project_id: milestone.project_id,
    };

    return this.projectTaskRepo.create(data);
  }

  // ✏️ UPDATE TASK (by taskId only)
  async updateTask(taskId: number, dto: UpdateProjectTaskDto): Promise<ProjectTask> {
    const task = await this.projectTaskRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    // 🧭 Check if relocating task to another milestone
    if (dto.project_milestone_id && dto.project_milestone_id !== task.project_milestone_id) {
      const newMilestone = await this.milestoneRepo.findById(dto.project_milestone_id);
      if (!newMilestone) {
        throw new BadRequestException('New milestone does not exist');
      }
      // Update project_id as well when moving task to new milestone
      dto.project_id = newMilestone.project_id;
    }

    const [count, [updatedTask]] = await this.projectTaskRepo.update(taskId, dto);

    if (count === 0) throw new NotFoundException('Failed to update task');

    return updatedTask;
  }

  // 📋 GET ALL TASKS UNDER A MILESTONE
  async getTaskByMilestone(milestoneId: number): Promise<ProjectMilestone> {
    return await this.milestoneRepo.findByIdWithTasks( milestoneId );
  }

  // 🔍 GET TASK BY ID
  async getTaskById(taskId: number): Promise<ProjectTask> {
    const task = await this.projectTaskRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async deleteMilestone(id: number) {
    const milestone = await this.milestoneRepo.findById(id);
    if (!milestone) throw new NotFoundException(`Milestone with ID ${id} not found`);
    return this.milestoneRepo.update(id, { deleted_at: new Date() });
  }
  async deleteTask(id: number) {
    const task = await this.projectTaskRepo.findById(id);
    if (!task) throw new NotFoundException(`Milestone with ID ${id} not found`);
    if (task.deleted_at) throw new NotFoundException(`Task with ID ${id} is already deleted`);
  
  
  
  await task.update({
    deleted_at: new Date(),
  });
  
  return {
    message: 'Task deleted successfully',
    deleted_id: id,
  };
  }
}
