import {
  BadRequestException,
  ConflictException,
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
import { Op, Sequelize } from 'sequelize';
import { ProjectDetailRepository } from 'repository/project-detail.repository';
import { CreateProjectMilestoneDto } from './dto/create-project-milestone.dto';
import {
  CreateProjectTaskDto,
  UpdateProjectTaskDto,
} from './dto/project_task.dto';
import { UpdateProjectPaymentDto } from './dto/update-project-payment.dto';
import { ProjectTask } from 'models/project-task.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { transformProjectConsultant } from './transformers/project-consultant-transformer';
import { GetConsultantsQueryDto } from './dto/get-query.dto';
import { ConsultantRepository } from 'repository/consultant.repository';
import { formatDate } from 'src/common/utils/date.filter';
import { ConsultantMonthlyBillRepository } from 'repository/consultant-monthly-bill.repository';
import { ProjectDocumentRepository } from 'repository/project-document.repository';
import { CommonService } from 'src/utility/common.service';
import { UploadProjectDocumentDto } from './dto/upload-project-document.dto';
import { UserRepository } from 'repository/user.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepo: ProjectRepository,
    private readonly projectConsultantRepo: ProjectConsultantRepository,
    private readonly industryRepo: ProjectIndustriesRepository,
    private readonly milestoneRepo: ProjectMilestoneRepository,
    private readonly paymentRepo: ProjectPaymentRepository,
    private readonly projectDetailrepository: ProjectDetailRepository,
    private readonly projectTaskRepo: ProjectTaskRepository,
    private readonly consultantRepo: ConsultantRepository,
    private readonly monthlyBillRepo: ConsultantMonthlyBillRepository,
    private readonly projectDocumentRepo: ProjectDocumentRepository,
    private readonly commonService: CommonService,
    private readonly userRepository: UserRepository,
  ) {}

  async createProject(user: any) {
  // 1. Project create
  const project = await this.projectRepo.create({
    client_id: user.id,
    name: `New Project for ${user?.name || 'Client'}`,
    company_name: 'Unknown Company',
    status: 'Initiated',
  });

  // 2. Default milestones
  const milestones = [
    'Planning',
    'Design',
    'Development',
    'Testing',
    'Delivery',
  ].map((name) => ({
    name,
    project_id: project.id,
    status: 'Pending',
    start_date: null,
    due_date: null,
    required_hours: null,
  }));

  // 3. Milestones create
  await this.milestoneRepo.bulkCreateMilestones(milestones);

  return project;
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

  async addConsultant(
  data: CreateProjectConsultantDto[],
  project_id: number,
) {
  const consultantIds = data.map(d => d.consultant_id);

  // 1️⃣ Upsert one by one
  for (const item of data) {
    const existing =
      await this.projectConsultantRepo.findOneByProjectAndConsultant(
        project_id,
        item.consultant_id,
      );

    if (existing) {
      // restore if deleted
      if (existing.deleted_at) {
        existing.deleted_at = null;
      }

      existing.requested_hours = item.requested_hours;
      existing.status = 'shortlisted';

      await existing.save(); // ✅ SAFE (instance)
      continue;
    }
    let existingConsultant = await this.consultantRepo.findByUserId(item.consultant_id);
    // create new
    await this.projectConsultantRepo.create({
      project_id,
      consultant_id: item.consultant_id,
      requested_hours: item.requested_hours,
      status: 'shortlisted',
      decided_rate: existingConsultant?.rate || 0,
      booking_schedule: null,
      is_doc_signed: false,
    });
  }

  // 2️⃣ Soft delete missing ones (ONE QUERY)
  await this.projectConsultantRepo.softDeleteNotIn(
    project_id,
    consultantIds,
  );

  return { message: 'Consultants synced successfully' };
}


  async getProjectConsultants(
    projectId: number,
    query: GetConsultantsQueryDto,
  ) {
    const where: any = { project_id: projectId, deleted_at: null };

    if (query.status && query.status.length > 0) {
      let statuses = query.status.split(',').map((s) => s.trim());
      where.status = { [Op.in]: statuses };
    }

    let proj_consultants = await this.projectConsultantRepo.findAll({
      where,
    });

    return transformProjectConsultant(proj_consultants);
  }

  async getProjectIndustries(projectId: number) {
    return this.industryRepo.findAll({
      where: { project_id: projectId },
    });
  }

  // ============================================================
// HELPER / REUSABLE FUNCTIONS
// ============================================================

private async validateMilestoneDates(
  projectId: number,
  startDate: Date,
  dueDate: Date,
  excludeMilestoneId?: number,
): Promise<void> {
  const overlapping = await this.milestoneRepo.findOverlapping(
    projectId,
    startDate,
    dueDate,
    excludeMilestoneId,
  );

  if (overlapping) {
    throw new ConflictException(
  `A milestone already exists in this date range (${await formatDate(overlapping.start_date)} → ${await formatDate(overlapping.due_date)})`,
);
  }
}

// ============================================================
// HELPER — milestone ke months generate karo with working hours
// ============================================================
private getMonthlyHoursBreakdown(
  startDate: Date,
  dueDate: Date,
  totalHours: number,
): { month: string; hours: number }[] {
  const result: { month: string; hours: number }[] = [];

  // Har month ke working days count karo
  const monthlyWorkingDays: { month: string; days: number }[] = [];
  let current = new Date(startDate);

  while (current <= dueDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // skip weekends
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyWorkingDays.find(m => m.month === key);
      if (existing) {
        existing.days++;
      } else {
        monthlyWorkingDays.push({ month: key, days: 1 });
      }
    }
    current.setDate(current.getDate() + 1);
  }

  const totalWorkingDays = monthlyWorkingDays.reduce((s, m) => s + m.days, 0);
  if (!totalWorkingDays) return result;

  for (const m of monthlyWorkingDays) {
    const ratio = m.days / totalWorkingDays;
    result.push({
      month: m.month,
      hours: parseFloat((totalHours * ratio).toFixed(2)),
    });
  }

  return result;
}

// ============================================================
// UPDATED — calculateAndSyncPayments
// ============================================================
private async calculateAndSyncPayments(
  milestone: ProjectMilestone,
): Promise<void> {
  if (!milestone?.required_hours) return;

  const consultants = await this.projectConsultantRepo.findByProjectId(
    milestone.project_id,
  );
  if (!consultants.length) return;

  const totalRequestedHours = consultants.reduce(
    (sum, c) => sum + (c.requested_hours || 0),
    0,
  );
  if (!totalRequestedHours) return;

  // Purane unpaid payments aur monthly bills delete karo
  await this.paymentRepo.deleteUnpaidByMilestoneId(milestone.id);
  await this.monthlyBillRepo.deleteUnpaidByMilestoneId(milestone.id);

  for (const consultant of consultants) {
    const ratio = (consultant.requested_hours || 0) / totalRequestedHours;
    const consultantHours = milestone.required_hours * ratio;
    const amount = consultantHours * (consultant.decided_rate || 0);

    // 1. Payment record (existing)
    await this.paymentRepo.create({
      project_id: milestone.project_id,
      project_milestone_id: milestone.id,
      amount,
      payment_module: 'milestone',
      is_paid: false,
    });

    // 2. Monthly bills (NAYA) — sirf agar dates hain
    if (milestone.start_date && milestone.due_date) {
      const monthlyBreakdown = this.getMonthlyHoursBreakdown(
        new Date(milestone.start_date),
        new Date(milestone.due_date),
        consultantHours,
      );

      for (const mb of monthlyBreakdown) {
        const monthlyAmount = mb.hours * (consultant.decided_rate || 0);

        await this.monthlyBillRepo.create({
          project_id: milestone.project_id,
          user_id: consultant.consultant_id, // consultant ki user_id
          milestone_id: milestone.id,
          month: mb.month,
          hours: mb.hours,
          amount: parseFloat(monthlyAmount.toFixed(2)),
          is_paid: false,
          pdf_url: null,
        });
      }
    }
  }
}


// ============================================================
// ADD MILESTONE
// ============================================================

async addMilestone(data: CreateProjectMilestoneDto) {
  // 1. Date range check
  if (data.start_date && data.due_date) {
    await this.validateMilestoneDates(
      data.project_id,
      new Date(data.start_date),
      new Date(data.due_date),
    );

    // 2. Required hours calculate
    data.required_hours = this.calculateWorkingHours(
      new Date(data.start_date),
      new Date(data.due_date),
    );
  } else {
    data.required_hours = 0;
  }

  // 3. Create milestone
  const milestone = await this.milestoneRepo.create(data);

  // 4. Payments sync
  await this.calculateAndSyncPayments(milestone);

  return milestone;
}


// ============================================================
// UPDATE MILESTONE
// ============================================================

async updateMilestone(id: number, data: CreateProjectMilestoneDto) {
  const milestone = await this.milestoneRepo.findById(id);

  if (!milestone) {
    throw new NotFoundException(`Milestone with ID ${id} not found`);
  }

  // 1. Paid check — block update, suggest new module
  const hasPaidPayments = await this.paymentRepo.hasPaidByMilestoneId(id);

  if (hasPaidPayments) {
    throw new ConflictException(
      'This milestone has already been paid. Please create a revision instead.',
    );
  }

  // 2. Date range check (exclude self)
  if (data.start_date && data.due_date) {
    await this.validateMilestoneDates(
      milestone.project_id,
      new Date(data.start_date),
      new Date(data.due_date),
      id, // exclude current milestone from overlap check
    );

    // 3. Required hours recalculate
    data.required_hours = this.calculateWorkingHours(
      new Date(data.start_date),
      new Date(data.due_date),
    );
  } else {
    data.required_hours = 0;
  }

  // 4. Update milestone
  const updatedMilestone = await this.milestoneRepo.update(id, data);

  // 5. Payments recalculate (unpaid wale delete hokey naye banenge)
  await this.calculateAndSyncPayments(updatedMilestone);

  return updatedMilestone;
}
  async getConsultantMonthlyBills(projectId: number, userId: number) {
  return this.monthlyBillRepo.findByProjectAndConsultant(projectId, userId);
}

  async uploadProjectDocument(
    body: UploadProjectDocumentDto,
    file: Express.Multer.File,
  ) {
    const projectId = Number(body.project_id);
    const consultantId = Number(body.user_id);

    if (!projectId || Number.isNaN(projectId)) {
      throw new BadRequestException('project_id is required');
    }

    if (!consultantId || Number.isNaN(consultantId)) {
      throw new BadRequestException('user_id is required');
    }

    if (!body.type?.trim()) {
      throw new BadRequestException('type is required');
    }

    const [project, consultant] = await Promise.all([
      this.projectRepo.findById(projectId),
      this.userRepository.findById(consultantId),
    ]);

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (!consultant) {
      throw new NotFoundException(`User with ID ${consultantId} not found`);
    }

    const url = await this.commonService.uploadToS3({
      file: file.buffer,
      folder: 'project-documents',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    const document = await this.projectDocumentRepo.create({
      project_id: projectId,
      consultant_id: consultantId,
      type: body.type,
      url,
    });

    return {
      message: 'Project document uploaded successfully',
      data: document,
    };
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

  calculateWorkingHours(start: Date, end: Date): number {
  let hours = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) {
      hours += 8;
    }
    current.setDate(current.getDate() + 1);
  }

  return hours;
}

  getPaymentsByProject(projectId: number) {
    return this.paymentRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async updatePayment(paymentId: number, data: UpdateProjectPaymentDto) {
    const payment = await this.paymentRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    const payload: any = {};

    if (data.project_id !== undefined) payload.project_id = Number(data.project_id);
    if (data.project_milestone_id !== undefined) {
      payload.project_milestone_id = Number(data.project_milestone_id);
    }
    if (data.doc_id !== undefined) payload.doc_id = Number(data.doc_id);
    if (data.amount !== undefined) payload.amount = Number(data.amount);
    if (data.payment_module !== undefined) payload.payment_module = data.payment_module;
    if (data.is_paid !== undefined) payload.is_paid = data.is_paid;

    if (Object.keys(payload).length === 0) {
      throw new BadRequestException('At least one payment field is required');
    }

    const [count, [updatedPayment]] = await this.paymentRepo.update(paymentId, payload);

    if (count === 0) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    return updatedPayment;
  }

}
