import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
  UpdateProjectConsultantRoleDto,
  UpdateProjectConsultantStatusDto,
} from './dto/create-project-consultant.dto';
import { ConsultantStatus, UserRole, UserStatus } from 'constant/enums';
import { Op } from 'sequelize';
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
import { InitiateProjectDto } from './dto/initiate-project.dto';
import { applyClientProfitMargin, normalizeProfitMargin } from 'src/common/utils/client-rate.util';

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

  private async assertProjectAccess(projectId: number | string, authUser: any) {
    const normalizedProjectId = Number(projectId);
    if (!Number.isInteger(normalizedProjectId) || normalizedProjectId < 1) {
      throw new BadRequestException('Project ID must be a positive integer');
    }
    const project = await this.projectRepo.findById(normalizedProjectId);
    if (!project || project.deleted_at) {
      throw new NotFoundException(`Project with ID ${normalizedProjectId} not found`);
    }
    const role = Number(authUser?.role);
    if (role === UserRole.ADMIN) return project;
    if (role === UserRole.CLIENT && Number(project.client_id) === Number(authUser?.id)) {
      return project;
    }
    if (role === UserRole.CONSULTANT) {
      const assignment = await this.projectConsultantRepo.findByProjectIdConsultantId(
        normalizedProjectId,
        Number(authUser?.id),
      );
      if (assignment && !assignment.deleted_at) return project;
    }
    throw new ForbiddenException('You are not allowed to manage this project');
  }

  async createProject(user: any, dto: InitiateProjectDto = {}) {
  const role = Number(user?.role);
  let clientId: number;
  let clientName = user?.username;
  let createdOnBehalf = false;

  if (role === UserRole.ADMIN) {
    clientId = Number(dto?.client_id);
    if (!Number.isInteger(clientId) || clientId < 1) {
      throw new BadRequestException('client_id is required for admin project creation');
    }

    const selectedClient = await this.userRepository.findClientCandidateById(clientId);
    if (!selectedClient || selectedClient.deleted_at) {
      throw new NotFoundException(`Client with ID ${clientId} not found`);
    }
    if (Number(selectedClient.role) !== UserRole.CLIENT) {
      throw new BadRequestException(`User with ID ${clientId} is not a client`);
    }
    if (String(selectedClient.status).toLowerCase() !== UserStatus.ACTIVE) {
      throw new BadRequestException('Selected client must be active');
    }

    clientName = selectedClient.username;
    createdOnBehalf = true;
  } else if (role === UserRole.CLIENT) {
    clientId = Number(user?.id);
    if (!Number.isInteger(clientId) || clientId < 1) {
      throw new BadRequestException('Authenticated client ID is invalid');
    }
    if (dto?.client_id !== undefined && Number(dto.client_id) !== clientId) {
      throw new ForbiddenException('Clients cannot create projects for another client');
    }
  } else {
    throw new ForbiddenException('Only clients and admins can create projects');
  }

  // 1. Project create
  const project = await this.projectRepo.create({
    client_id: clientId,
    created_by: Number(user.id),
    created_on_behalf: createdOnBehalf,
    name: `New Project for ${clientName || 'Client'}`,
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

  return {
    message: createdOnBehalf
      ? 'Project created on behalf of client successfully'
      : 'Project created successfully',
    data: project,
  };
}




  async getProjectById(id: number, authUser: any) {
    return this.assertProjectAccess(id, authUser);
  }

  async updateProject(id: number, updateData: UpdateProjectDto, authUser: any) {
    const project = await this.assertProjectAccess(id, authUser);
    let payload = {
      name: updateData.name ?? project.name,
      company_name: updateData.company_name ?? updateData.industry ?? project.company_name,
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
      // Cost is derived from milestone payments; project edits must not override it.
      cost: existingProjectDetail?.cost ?? 0,
      paid_amount: existingProjectDetail?.paid_amount ?? 0,
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

  async updateProjectConsultantStatus(body: UpdateProjectConsultantStatusDto, authUser: any) {
    await this.assertProjectAccess(Number(body.project_id), authUser);
    const assignment =
      await this.projectConsultantRepo.findByProjectIdConsultantId(
        body.project_id,
        body.consultant_id,
      );
    if (!assignment || assignment.deleted_at) {
      throw new NotFoundException(
        `Consultant with ID ${body.consultant_id} not found in project ID ${body.project_id}`,
      );
    }
    const nextStatus = body.status as ConsultantStatus;
    if (!Object.values(ConsultantStatus).includes(nextStatus)) {
      throw new BadRequestException(`Invalid consultant status: ${body.status}`);
    }
    const currentStatus = assignment.status as ConsultantStatus;
    const progression = [
      ConsultantStatus.SHORTLISTED,
      ConsultantStatus.INTERVIEW_SCHEDULED,
      ConsultantStatus.INTERVIEW_DONE,
      ConsultantStatus.OFFERED,
      ConsultantStatus.HIRED,
    ];
    if (currentStatus === ConsultantStatus.REJECTED && nextStatus !== currentStatus) {
      throw new ConflictException('Rejected assignment cannot be reopened');
    }
    const currentIndex = progression.indexOf(currentStatus);
    const nextIndex = progression.indexOf(nextStatus);
    if (nextStatus !== ConsultantStatus.REJECTED && currentStatus !== nextStatus && currentIndex >= 0 && nextIndex <= currentIndex) {
      throw new ConflictException(`Invalid status transition from ${currentStatus} to ${nextStatus}`);
    }
    const where = {
      project_id: body.project_id,
      consultant_id: body.consultant_id,
    };
    const payload: any = { status: nextStatus };
    if (body.role !== undefined) payload.role = body.role.trim() || null;
    if (body.booking_schedule !== undefined) payload.booking_schedule = body.booking_schedule;
    if (body.decided_rate !== undefined) {
      const rate = Number(body.decided_rate);
      if (!Number.isFinite(rate) || rate < 0) throw new BadRequestException('decided_rate must be zero or greater');
      payload.decided_rate = rate;
    }
    if (body.requested_hours !== undefined) {
      const hours = Number(body.requested_hours);
      if (!Number.isInteger(hours) || hours < 1) throw new BadRequestException('requested_hours must be a positive integer');
      payload.requested_hours = hours;
    }
    const effectiveRate = payload.decided_rate ?? Number(assignment.decided_rate || 0);
    if ([ConsultantStatus.OFFERED, ConsultantStatus.HIRED].includes(nextStatus) && effectiveRate <= 0) {
      throw new BadRequestException('A positive decided_rate is required before offering or hiring');
    }
    if (nextStatus === ConsultantStatus.OFFERED && payload.role === undefined) {
      payload.role = assignment.role || 'consultant';
    }
    const result = await this.projectConsultantRepo.update(where, payload);
    await this.syncProjectMilestonePayments(Number(body.project_id));
    return result;
  }

  async updateProjectConsultantRole(body: UpdateProjectConsultantRoleDto, authUser: any) {
    await this.assertProjectAccess(Number(body.project_id), authUser);
    const assignment =
      await this.projectConsultantRepo.findByProjectIdConsultantId(
        body.project_id,
        body.consultant_id,
      );
    if (!assignment || assignment.deleted_at) {
      throw new NotFoundException(
        `Consultant with ID ${body.consultant_id} not found in project ID ${body.project_id}`,
      );
    }
    const where = {
      project_id: body.project_id,
      consultant_id: body.consultant_id,
    };
    const payload: any = {};
    if (body.role !== undefined) payload.role = body.role;
    if (body.booking_schedule !== undefined) payload.booking_schedule = body.booking_schedule;
    if (!Object.keys(payload).length) {
      throw new BadRequestException('role or booking_schedule is required');
    }
    return this.projectConsultantRepo.update(where, payload);
  }

  async deleteProject(id: number, authUser: any) {
    await this.assertProjectAccess(id, authUser);
    return this.projectRepo.delete(id);
  }

  async addConsultant(
  data: CreateProjectConsultantDto[],
  project_id: number,
  authUser: any,
) {
  await this.assertProjectAccess(project_id, authUser);
  if (!Array.isArray(data) || !data.length) {
    throw new BadRequestException('At least one consultant is required');
  }
  const consultantIds = data.map(d => d.consultant_id);
  if (new Set(consultantIds.map(Number)).size !== consultantIds.length) {
    throw new BadRequestException('Duplicate consultant IDs are not allowed');
  }

  // 1️⃣ Upsert one by one
  for (const item of data) {
    const requestedHours = Number(item.requested_hours);
    if (!Number.isInteger(requestedHours) || requestedHours < 1) {
      throw new BadRequestException(`requested_hours must be positive for consultant ${item.consultant_id}`);
    }
    const [consultantProfile, consultantUser] = await Promise.all([
      this.consultantRepo.findByUserId(Number(item.consultant_id)),
      this.userRepository.findById(Number(item.consultant_id)),
    ]);
    if (!consultantUser || Number(consultantUser.role) !== UserRole.CONSULTANT || !consultantProfile) {
      throw new BadRequestException(`User ${item.consultant_id} is not a valid consultant`);
    }
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

      existing.requested_hours = requestedHours;
      existing.status = 'shortlisted';

      await existing.save(); // ✅ SAFE (instance)
      continue;
    }
    // create new
    await this.projectConsultantRepo.create({
      project_id,
      consultant_id: item.consultant_id,
      requested_hours: requestedHours,
      status: 'shortlisted',
      decided_rate: consultantProfile.rate || 0,
      booking_schedule: null,
      is_doc_signed: false,
    });
  }

  // 2️⃣ Soft delete missing ones (ONE QUERY)
  await this.syncProjectMilestonePayments(project_id);
  return { message: 'Consultants added successfully' };
}

  async syncConsultants(data: CreateProjectConsultantDto[], projectId: number, authUser: any) {
    if (!Array.isArray(data)) throw new BadRequestException('Consultants payload must be an array');
    await this.assertProjectAccess(projectId, authUser);
    if (data.length) await this.addConsultant(data, projectId, authUser);
    await this.projectConsultantRepo.softDeleteNotIn(projectId, data.map(item => Number(item.consultant_id)));
    await this.syncProjectMilestonePayments(projectId);
    return { message: 'Project team synced successfully' };
  }

  async removeConsultant(projectId: number, consultantId: number, authUser: any) {
    await this.assertProjectAccess(projectId, authUser);
    const assignment = await this.projectConsultantRepo.findByProjectIdConsultantId(projectId, consultantId);
    if (!assignment || assignment.deleted_at) throw new NotFoundException('Active project consultant not found');
    if (assignment.status === ConsultantStatus.HIRED) {
      throw new ConflictException('A hired consultant must be rejected before removal');
    }
    await this.projectConsultantRepo.softDeleteOne(projectId, consultantId);
    await this.syncProjectMilestonePayments(projectId);
    return { message: 'Consultant removed from project' };
  }


  async getProjectConsultants(
    projectId: number,
    query: GetConsultantsQueryDto,
    authUser: any,
  ) {
    const project = await this.assertProjectAccess(projectId, authUser);
    const where: any = { project_id: projectId, deleted_at: null };

    if (query.status && query.status.length > 0) {
      let statuses = query.status.split(',').map((s) => s.trim());
      where.status = { [Op.in]: statuses };
    }

    const projectConsultants = await this.projectConsultantRepo.findAll({
      where,
    });
    let data = transformProjectConsultant(projectConsultants);
    const profitMarginPercentage = normalizeProfitMargin(
      project?.client?.profit_margin_percentage,
    );
    data = data.map(item => ({
      ...item,
      rate: applyClientProfitMargin(item.rate, profitMarginPercentage),
      decided_rate: applyClientProfitMargin(
        item.decided_rate,
        profitMarginPercentage,
      ),
      ...(Number(authUser?.role) === UserRole.ADMIN
        ? { profit_margin_percentage: profitMarginPercentage }
        : {}),
    }));
    if (query.name?.trim()) {
      const search = query.name.trim().toLowerCase();
      data = data.filter(item =>
        [item.name, item.email, item.phone].some(value => String(value || '').toLowerCase().includes(search)),
      );
    }
    if (query.module_id !== undefined && query.module_id !== null) {
      const moduleId = Number(query.module_id);
      if (!Number.isInteger(moduleId)) throw new BadRequestException('module_id must be an integer');
      data = data.filter(item => [...item.core_module_ids, ...item.other_module_ids].includes(moduleId));
    }
    const page = Math.max(Number(query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query.limit) || data.length || 1, 1), 100);
    const total = data.length;
    return {
      data: data.slice((page - 1) * limit, page * limit),
      pagination: {
        total,
        current_page: page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    };
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

  if (await this.paymentRepo.hasPaidByMilestoneId(milestone.id)) return;

  await this.paymentRepo.deleteUnpaidByMilestoneId(milestone.id);

  const assignments = await this.projectConsultantRepo.findByProjectId(
    milestone.project_id,
  );
  const consultants = assignments.filter(assignment =>
    [ConsultantStatus.OFFERED, ConsultantStatus.HIRED].includes(assignment.status as ConsultantStatus),
  );
  if (!consultants.length) return;

  const totalRequestedHours = consultants.reduce(
    (sum, c) => sum + (c.requested_hours || 0),
    0,
  );
  if (!totalRequestedHours) return;

  // Milestone cost is client-facing. Consultant/task billing is handled separately.
  const project = await this.projectRepo.findById(Number(milestone.project_id));
  const profitMarginPercentage = normalizeProfitMargin(
    project?.client?.profit_margin_percentage,
  );
  const amount = consultants.reduce((total, consultant) => {
    const ratio = Number(consultant.requested_hours || 0) / totalRequestedHours;
    const consultantHours = Number(milestone.required_hours) * ratio;
    const clientHourlyRate = applyClientProfitMargin(
      consultant.decided_rate,
      profitMarginPercentage,
    );
    return total + consultantHours * clientHourlyRate;
  }, 0);

  await this.paymentRepo.create({
    project_id: milestone.project_id,
    project_milestone_id: milestone.id,
    amount: Number(amount.toFixed(2)),
    payment_module: 'milestone',
    is_paid: false,
  });
}


private async syncProjectMilestonePayments(projectId: number) {
  const milestones = await this.milestoneRepo.findByProjectId(projectId);
  for (const milestone of milestones.filter(item => !item.deleted_at)) {
    await this.calculateAndSyncPayments(milestone);
  }
}

// ============================================================
// ADD MILESTONE
// ============================================================

async addMilestone(data: CreateProjectMilestoneDto, authUser: any) {
  await this.assertProjectAccess(Number(data.project_id), authUser);
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

async updateMilestone(id: number, data: CreateProjectMilestoneDto, authUser: any) {
  const milestone = await this.milestoneRepo.findById(id);

  if (!milestone) {
    throw new NotFoundException(`Milestone with ID ${id} not found`);
  }
  await this.assertProjectAccess(milestone.project_id, authUser);

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
    authUser: any,
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

    await this.assertProjectAccess(projectId, authUser);
    const consultant = await this.userRepository.findById(consultantId);

    if (!consultant || Number(consultant.role) !== UserRole.CONSULTANT) {
      throw new NotFoundException(`Consultant with ID ${consultantId} not found`);
    }

    const assignment = await this.projectConsultantRepo.findByProjectIdConsultantId(
      projectId,
      consultantId,
    );
    if (!assignment || assignment.deleted_at) {
      throw new BadRequestException('Consultant is not assigned to this project');
    }
    if (
      Number(authUser?.role) === UserRole.CONSULTANT &&
      Number(authUser?.id) !== consultantId
    ) {
      throw new ForbiddenException('Consultants can only upload their own project documents');
    }

    /* The actor is authorized above; consultant_id remains the document owner. */
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

  async getMilestonesByProject(id: number, authUser: any) {
    await this.assertProjectAccess(id, authUser);
    let isMMilestoneExist = await this.milestoneRepo.findAll({
      where: { project_id: id }
    });
    return isMMilestoneExist;
  }

  async getMilestoneById(id: number, authUser: any) {
    if (!Number.isInteger(id) || id < 1) {
      throw new BadRequestException('Milestone ID must be a positive integer');
    }

    const milestone = await this.milestoneRepo.findById(id);
    if (!milestone || milestone.deleted_at) {
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    }

    await this.assertProjectAccess(Number(milestone.project_id), authUser);
    return milestone;
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
    authUser: any,
  ): Promise<ProjectTask> {
    if (!dto.name?.trim()) {
      throw new BadRequestException('Task name is required');
    }

    const milestone = await this.milestoneRepo.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    await this.assertProjectAccess(milestone.project_id, authUser);

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
    authUser: any,
  ): Promise<ProjectTask> {
    const task = await this.projectTaskRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(task.project_id, authUser);

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
      if (newMilestone.project_id !== task.project_id) {
        throw new BadRequestException('A task cannot be moved to another project');
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
  async getTaskByMilestone(milestoneId: number, authUser: any): Promise<ProjectMilestone> {
    const milestone = await this.milestoneRepo.findById(milestoneId);
    if (!milestone) throw new NotFoundException('Milestone not found');
    await this.assertProjectAccess(milestone.project_id, authUser);
    return await this.milestoneRepo.findByIdWithTasks(milestoneId);
  }

  // 🔍 Get Task By Id
  async getTaskById(taskId: number, authUser: any): Promise<ProjectTask> {
    const task = await this.projectTaskRepo.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    await this.assertProjectAccess(task.project_id, authUser);
    return task;
  }

  // ❌ Detete Milestone
  async deleteMilestone(id: number, authUser: any) {
    const milestone = await this.milestoneRepo.findById(id);
    if (!milestone)
      throw new NotFoundException(`Milestone with ID ${id} not found`);
    await this.assertProjectAccess(milestone.project_id, authUser);
    if (await this.paymentRepo.hasPaidByMilestoneId(id)) {
      throw new ConflictException('A paid milestone cannot be deleted');
    }
    await this.paymentRepo.deleteUnpaidByMilestoneId(id);
    return this.milestoneRepo.update(id, { deleted_at: new Date() });
  }

  // ❌ Delete Task
  async deleteTask(id: number, authUser: any) {
    const task = await this.projectTaskRepo.findById(id);
    if (!task) throw new NotFoundException(`Milestone with ID ${id} not found`);
    await this.assertProjectAccess(task.project_id, authUser);
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

  async getPaymentsByProject(projectId: number, authUser: any) {
    await this.assertProjectAccess(projectId, authUser);
    return this.paymentRepo.findAll({
      where: { project_id: projectId },
    });
  }

  async updatePayment(paymentId: number, data: UpdateProjectPaymentDto, authUser: any) {
    const payment = await this.paymentRepo.findById(paymentId);

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }
    await this.assertProjectAccess(payment.project_id, authUser);
    if (data.project_id !== undefined && Number(data.project_id) !== payment.project_id) {
      throw new BadRequestException('A payment cannot be moved to another project');
    }

    const payload: any = {};

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
