import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ProjectIndustriesRepository } from '../../repository/project-indestries.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectPaymentRepository } from '../../repository/project-payment.repository';
import { ProjectTaskRepository } from '../../repository/project-task.repository';
import { UpdateProjectDto } from './dto/update-project.dto';
import {
  CreateProjectConsultantDto,
  UpdateProjectConsultantStatusDto,
} from './dto/create-project-consultant.dto';
import { ConsultantStatus } from 'constant/enums';
import { Op } from 'sequelize';
import { ProjectDetailRepository } from 'repository/project-detail.repository';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import {
  CreateProjectTaskDto,
  UpdateProjectTaskDto,
} from './dto/project_task.dto';
import { ProjectTask } from 'models/project-task.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { transformProjectConsultant } from './transformers/project-consultant-transformer';
import { GetConsultantsQueryDto } from './dto/get-query.dto';

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
  ) {}

  async createProject(user: any) {
    return await this.projectRepo.create({
      client_id: user.id,
      name: `New Project for ${user?.name || 'Client'}`,
      company_name: 'Unknown Company',
      status: 'Initiated',
    });
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
    let payload = {
      name: updateData.name ?? project.name,
      company_name: updateData.industry ?? project.company_name,
      status: updateData.status ?? project.status,
    };

    await this.projectRepo.update(id, payload);

    const existingProjectDetail =
      await this.projectDetailrepository.findByProjectId(id);

    const projectDetailpayload = {
      project_id: id,
      start_date:
        updateData.start_date ?? existingProjectDetail?.start_date ?? null,
      end_date: updateData.end_date ?? existingProjectDetail?.end_date ?? null,
      duration: updateData.duration ?? existingProjectDetail?.duration ?? null,
      cost: updateData.cost ?? existingProjectDetail?.cost ?? 0,
      paid_amount:
        updateData.paid_amount ?? existingProjectDetail?.paid_amount ?? 0,
    };

    existingProjectDetail
      ? await this.projectDetailrepository.update(id, projectDetailpayload)
      : await this.projectDetailrepository.create(projectDetailpayload);

    delete project.projectDetails;
    // 🔥 Convert Sequelize Model
    const plainProject = project.toJSON();

    return {
      ...plainProject,
    };
  }

  async updateProjectConsultantStatus(body: UpdateProjectConsultantStatusDto) {
    let IsConsultantExist =
      await this.projectConsultantRepo.findByProjectIdConsultantId(
        body.project_id,
        body.consultant_id,
      );
    if (!IsConsultantExist) {
      throw new NotFoundException(
        `Consultant with ID ${body.consultant_id} not found in project ID ${body.project_id}`,
      );
    }
    let where = {
      project_id: body.project_id,
      consultant_id: body.consultant_id,
    };
    if (body.status == ConsultantStatus.OFFERED) {
      // 🔏 Todo: Send NDA
      // 🚀 Todo: Send Email
      // 👤 Set User Role As Well
      await this.projectConsultantRepo.update(where, {
        role: body.role ?? 'consultant',
        status: body.status,
        booking_schedule: body.booking_schedule ?? null,
      });
    } else if (body.status == ConsultantStatus.REJECTED) {
      // 📧 Todo: Send Rejection Email
    }
    return await this.projectConsultantRepo.update(where, {
      status: body.status,
    });
  }

  async updateProjectConsultantRole(body: UpdateProjectConsultantStatusDto) {
    console.log('service role dto', body);
    let IsConsultantExist =
      await this.projectConsultantRepo.findByProjectIdConsultantId(
        body.project_id,
        body.consultant_id,
      );
    if (!IsConsultantExist) {
      throw new NotFoundException(
        `Consultant with ID ${body.consultant_id} not found in project ID ${body.project_id}`,
      );
    }
    let where = {
      project_id: body.project_id,
      consultant_id: body.consultant_id,
    };
    return await this.projectConsultantRepo.update(where, {
      role: body.role ?? null,
      booking_schedule: body.booking_schedule ?? null,
    });
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
          is_doc_signed: false,
        };

        await this.projectConsultantRepo.create(projectConsultant);
        // 📧 Todo: send email to consultant about being added to project
      }
      return { message: 'Consultants added successfully', data };
    } catch (error) {
      throw error;
    }
  }

  async getProjectConsultants(
    projectId: number,
    query: GetConsultantsQueryDto,
  ) {
    const where: any = { project_id: projectId };

    if (query.status && query.status.length > 0) {
      let statuses = query.status.split(',').map((s) => s.trim());
      where.status = { [Op.in]: statuses };
    }

    let proj_consultants = await this.projectConsultantRepo.findAll({
      where,
    });
    console.log('proj_consultants', proj_consultants);

    return transformProjectConsultant(proj_consultants);
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
  
  async getMilestonesByProject(id: number) {
    let isMMilestoneExist = await this.milestoneRepo.findAll({
      where: { project_id: id }
    });
    return isMMilestoneExist;
  }

  async getProjectMilestones(projectId: number) {
    return this.milestoneRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async addPayment(data: any) {
    return this.paymentRepo.create(data);
  }

  // 🆕 CREATE TASK (Always Under Milestone)
  async createTask(
    milestoneId: number,
    dto: CreateProjectTaskDto,
  ): Promise<ProjectTask> {
    console.log(dto);
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

  // ✏️ UPDATE TASK (By TaskId Only)
  async updateTask(
    taskId: number,
    dto: UpdateProjectTaskDto,
  ): Promise<ProjectTask> {
    const task = await this.projectTaskRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    // 🧭 Check If Relocating Task To Another Milestone
    if (
      dto.project_milestone_id &&
      dto.project_milestone_id !== task.project_milestone_id
    ) {
      const newMilestone = await this.milestoneRepo.findById(
        dto.project_milestone_id,
      );
      if (!newMilestone) {
        throw new BadRequestException('New milestone does not exist');
      }
      // 📣 Update Project_Id As Well When Moving Task To New Milestone
      dto.project_id = newMilestone.project_id;
    }

    const [count, [updatedTask]] = await this.projectTaskRepo.update(
      taskId,
      dto,
    );

    if (count === 0) throw new NotFoundException('Failed to update task');

    return updatedTask;
  }

  // 📋 Get All Tasks Under A Milestone
  async getTaskByMilestone(milestoneId: number): Promise<ProjectMilestone> {
    return await this.milestoneRepo.findByIdWithTasks(milestoneId);
  }

  // 🔍 Get Task By Id
  async getTaskById(taskId: number): Promise<ProjectTask> {
    const task = await this.projectTaskRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // ❌ Detete Milestone
  async deleteMilestone(id: number) {
    const milestone = await this.milestoneRepo.findById(id);
    if (!milestone)
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    return this.milestoneRepo.update(id, { deleted_at: new Date() });
  }

  // ❌ Delete Task
  async deleteTask(id: number) {
    const task = await this.projectTaskRepo.findById(id);
    if (!task) throw new NotFoundException(`Milestone with ID ${id} not found`);
    if (task.deleted_at)
      throw new NotFoundException(`Task with ID ${id} is already deleted`);

    await task.update({
      deleted_at: new Date(),
    });

    return {
      message: 'Task deleted successfully',
      deleted_id: id,
    };
  }
}
