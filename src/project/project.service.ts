import { syncMilestoneTeam } from './milestone-team.service';
import { refreshUsdRates, usdClientRates } from './usd-exchange-rate.service';
import { ProjectPayment } from 'models/project-payment.model';
import { TeamBuilderService } from './team-builder.service';
import { assertProjectAccess, validateProjectId } from './project-access';
import { SaveTeamBuilderDto } from './dto/team-builder.dto';
import { Transaction } from 'sequelize';
import { ProjectConsultant } from 'models/project-consultant.model';
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
import { Op, QueryTypes } from 'sequelize';
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
  private normalizeRoleTitle(value: unknown): string {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 120) {
      throw new BadRequestException('Role title must be a nonempty string of at most 120 characters');
    }
    return value.trim();
  }

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
    private readonly teamBuilder: TeamBuilderService,
  ) {}

  private async assertProjectAccess(projectId: number | string, authUser: any, transaction?: Transaction) {
    const normalizedProjectId = validateProjectId(projectId);
    const project = await this.projectRepo.findById(normalizedProjectId, transaction);
    if (!project || project.deleted_at) {
      throw new NotFoundException(`Project with ID ${normalizedProjectId} not found`);
    }
    const role = Number(authUser?.role);
    if (role === UserRole.CONSULTANT) {
      const assignment = await this.projectConsultantRepo.findByProjectIdConsultantId(
        normalizedProjectId,
        Number(authUser?.id),
      );
      if (assignment && !assignment.deleted_at) return project;
    }
    assertProjectAccess(project, authUser);
    return project;
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
    return this.teamBuilder.locked(id, authUser, async (project, transaction) => {
      const payload: any = {};
      if (updateData.client_id !== undefined) {
        const value: unknown = updateData.client_id;
        const clientId = Number(value);
        if ((typeof value !== 'number' && !(typeof value === 'string' && /^[1-9]\d*$/.test(value))) ||
            !Number.isSafeInteger(clientId) || clientId < 1) {
          throw new BadRequestException('client_id must be a positive integer');
        }
        if (clientId !== Number(project.client_id)) {
          if (Number(authUser?.role) !== UserRole.ADMIN) {
            throw new ForbiddenException('Only admins can reassign a project to another client');
          }
          const client = await this.userRepository.findClientCandidateById(clientId, transaction);
          if (!client || client.deleted_at) throw new NotFoundException('Selected client not found');
          if (Number(client.role) !== UserRole.CLIENT) throw new BadRequestException('Selected user must be a client');
          if (String(client.status).toLowerCase() !== UserStatus.ACTIVE) throw new BadRequestException('Selected client must be active');
          payload.client_id = clientId;
        }
      }

      if (updateData.name != null) payload.name = updateData.name;
      if (updateData.status === 'in_progress' && project.status !== 'in_progress') {
        const paid = await ProjectPayment.findOne({
          where: { project_id: id, is_paid: true, deleted_at: null, amount: { [Op.gt]: 0 } },
          transaction,
        });
        if (!paid) throw new ConflictException('At least one payment must be paid before starting the project');
      }
      if (updateData.status != null) payload.status = updateData.status;
      const companyName = updateData.company_name ?? updateData.industry;
      if (companyName != null) payload.company_name = companyName;
      if (Object.keys(payload).length) await this.projectRepo.update(id, payload, transaction);
      if (payload.client_id !== undefined) {
        await this.projectDetailrepository.reassignOwner(id, Number(project.client_id), payload.client_id, transaction);
      }

      // Only explicitly supplied editable details are written. Database pricing
      // triggers recalculate configured unpaid teams after a client change.
      const details: any = {};
      if (updateData.start_date != null) details.start_date = updateData.start_date;
      if (updateData.end_date != null) details.end_date = updateData.end_date;
      if (updateData.duration != null) details.duration = updateData.duration;
      if (Object.keys(details).length) {
        const existing = await this.projectDetailrepository.findByProjectId(id, transaction);
        if (existing) {
          await this.projectDetailrepository.update(existing.id, details, transaction);
        } else {
          await this.projectDetailrepository.create({ project_id: id, ...details, cost: 0, paid_amount: 0 }, transaction);
        }
      }
      return this.projectRepo.findById(id, transaction);
    });
  }

  async updateProjectConsultantStatus(body: UpdateProjectConsultantStatusDto, authUser: any) {
    return this.teamBuilder.locked(Number(body.project_id), authUser, async (_project, transaction) => {
    await this.assertProjectAccess(Number(body.project_id), authUser, transaction);
    const assignment =
      await this.projectConsultantRepo.findByProjectIdConsultantId(
        body.project_id,
        body.consultant_id, transaction,
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
    if (body.role !== undefined) payload.role = this.normalizeRoleTitle(body.role);
    if (body.booking_schedule !== undefined) payload.booking_schedule = body.booking_schedule;
    if (body.rate_basis !== undefined && !['base', 'client'].includes(body.rate_basis)) {
      throw new BadRequestException('rate_basis must be base or client');
    }
    if (body.rate_basis !== undefined && body.decided_rate === undefined) {
      throw new BadRequestException('rate_basis requires decided_rate');
    }
    if (body.decided_rate !== undefined) {
      const rate = Number(body.decided_rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1000000000 ||
          Math.abs(rate * 100 - Math.round(rate * 100)) > 0.000001) {
        throw new BadRequestException('decided_rate must be nonnegative, at most 1000000000, with at most two decimals');
      }
      payload.decided_rate = rate;
      if (body.rate_basis === 'client') {
        const client = await this.userRepository.findClientCandidateById(Number(_project.client_id), transaction);
        const margin = normalizeProfitMargin(client?.profit_margin_percentage);
        const [converted] = await ProjectConsultant.sequelize.query<{ rate: string }>(
          'SELECT round(CAST(:rate AS numeric) / (1 + CAST(:margin AS numeric) / 100), 2) AS rate',
          { replacements: { rate, margin }, type: QueryTypes.SELECT, transaction },
        );
        payload.decided_rate = Number(converted.rate);
      }
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
    const result = await this.projectConsultantRepo.update(where, payload, transaction);
    await this.syncProjectMilestonePayments(Number(body.project_id), transaction);
    return result;
    });
  }

  async updateProjectConsultantRole(body: UpdateProjectConsultantRoleDto, authUser: any) {
    return this.teamBuilder.locked(Number(body.project_id), authUser, async (_project, transaction) => {
    await this.assertProjectAccess(Number(body.project_id), authUser, transaction);
    const assignment =
      await this.projectConsultantRepo.findByProjectIdConsultantId(
        body.project_id,
        body.consultant_id, transaction,
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
    if (body.role !== undefined) payload.role = this.normalizeRoleTitle(body.role);
    if (body.booking_schedule !== undefined) payload.booking_schedule = body.booking_schedule;
    if (!Object.keys(payload).length) {
      throw new BadRequestException('role or booking_schedule is required');
    }
    return this.projectConsultantRepo.update(where, payload, transaction);
    });
  }

  async deleteProject(id: number, authUser: any) {
    await this.assertProjectAccess(id, authUser);
    return this.projectRepo.delete(id);
  }

  getTeamBuilder(projectId: number, user: any) {
    return this.teamBuilder.get(projectId, user);
  }

  saveTeamBuilder(projectId: number, dto: SaveTeamBuilderDto, user: any) {
    return this.teamBuilder.save(projectId, user, dto, transaction => this.syncProjectMilestonePayments(projectId, transaction));
  }

  private async replaceLegacyTeam(data: CreateProjectConsultantDto[], projectId: number, user: any, append = false, removeId?: number) {
    if (!Array.isArray(data)) throw new BadRequestException('Consultants payload must be an array');
    return this.teamBuilder.locked(projectId, user, async (project, transaction) => {
      const existing = await ProjectConsultant.findAll({ where: { project_id: projectId }, transaction });
      const current = existing.filter(item => !item.deleted_at);
      let consultants = data.map(item => ({ consultant_id: Number(item.consultant_id), requested_hours: Number(item.requested_hours) }));
      if (append) consultants = [...current.filter(item => item.status !== ConsultantStatus.REJECTED && !consultants.some(next => next.consultant_id === Number(item.consultant_id)))
        .map(item => ({ consultant_id: Number(item.consultant_id), requested_hours: Number(item.requested_hours) })), ...consultants];
      if (removeId !== undefined) {
        const removedMember = current.find(item => Number(item.consultant_id) === removeId);
        if (!removedMember) throw new NotFoundException('Active project consultant not found');
        // Rejected records are excluded from the editable snapshot, so replace()
        // cannot soft-delete them. Honour this explicit legacy removal here.
        if (removedMember.status?.toLowerCase() === ConsultantStatus.REJECTED) {
          await removedMember.update({ deleted_at: new Date() }, { transaction });
        }
        consultants = current.filter(item => Number(item.consultant_id) !== removeId && item.status !== ConsultantStatus.REJECTED)
          .map(item => ({ consultant_id: Number(item.consultant_id), requested_hours: Number(item.requested_hours) }));
      }
      // The legacy shortlist endpoint is the explicit re-shortlisting action.
      for (const item of existing.filter(item => item.status === ConsultantStatus.REJECTED && consultants.some(next => next.consultant_id === Number(item.consultant_id)))) {
        if (item.is_doc_signed || item.booking_schedule != null) throw new ConflictException('Contracted consultant cannot be re-shortlisted');
        await item.update({ status: ConsultantStatus.SHORTLISTED }, { transaction });
      }
      const ids = new Set(consultants.map(item => String(item.consultant_id)));
      return this.teamBuilder.replace(project, transaction, {
        revision: project.team_builder_revision, consultants,
        roles: project.team_builder_roles.map(role => ({ ...role, personIds: role.personIds.filter(id => ids.has(id)) })),
      }, tx => this.syncProjectMilestonePayments(projectId, tx));
    });
  }

  async addConsultant(data: CreateProjectConsultantDto[], projectId: number, user: any) {
    if (!Array.isArray(data) || !data.length) throw new BadRequestException('At least one consultant is required');
    await this.replaceLegacyTeam(data, projectId, user, true);
    return { message: 'Consultants added successfully' };
  }

  async syncConsultants(data: CreateProjectConsultantDto[], projectId: number, user: any) {
    await this.replaceLegacyTeam(data, projectId, user);
    return { message: 'Project team synced successfully' };
  }

  async removeConsultant(projectId: number, consultantId: number, user: any) {
    await this.replaceLegacyTeam([], projectId, user, false, consultantId);
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
    if (query.billing_currency && query.billing_currency !== 'USD')
      throw new BadRequestException('billing_currency must be USD');
    let usdRates: Awaited<ReturnType<typeof usdClientRates>>;
    if (query.billing_currency === 'USD') {
      if (data.some(item => String(item.currency || 'USD').trim().toUpperCase() !== 'USD'))
        await refreshUsdRates();
      usdRates = await usdClientRates(data, profitMarginPercentage);
    }
    data = data.map((item, index) => ({
      ...item,
      rate: usdRates ? usdRates[index].rate : applyClientProfitMargin(item.rate, profitMarginPercentage),
      decided_rate: usdRates ? usdRates[index].decided_rate : applyClientProfitMargin(
        item.decided_rate,
        profitMarginPercentage,
      ),
      ...(usdRates ? { currency: 'USD', source_currency: item.currency, fx_as_of: usdRates[index].fx_as_of, billing_preview: true } : {}),
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
        has_next_page: page * limit < total,
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
  transaction?: Transaction,
): Promise<void> {
  if (!milestone) return;
  // Selected weekly hours are expanded over the milestone's working weeks.
  // The database also synchronizes membership, pricing and duration changes.
  await syncMilestoneTeam(milestone.id, transaction);
}


private async syncProjectMilestonePayments(projectId: number, transaction?: Transaction) {
  const milestones = await this.milestoneRepo.findByProjectId(projectId, transaction);
  for (const milestone of milestones.filter(item => !item.deleted_at)) {
    await this.calculateAndSyncPayments(milestone, transaction);
  }
}

// ============================================================
// ADD MILESTONE
// ============================================================

private milestoneFields(data: CreateProjectMilestoneDto) {
  const allowed = new Set(['project_id','name','description','start_date','due_date','status','required_hours']);
  if (Object.keys(data).some(key => !allowed.has(key)))
    throw new BadRequestException('Unknown milestone field; hours are calculated from the selected team and milestone dates');
  const payload: any = {};
  for (const key of allowed) if (key !== 'project_id' && data[key] !== undefined) payload[key] = data[key];
  return payload;
}

async addMilestone(data: CreateProjectMilestoneDto, authUser: any) {
  const payload = this.milestoneFields(data);
  return this.teamBuilder.locked(Number(data.project_id), authUser, async (project, transaction) => {
    if (data.start_date && data.due_date) {
      await this.validateMilestoneDates(project.id, new Date(data.start_date), new Date(data.due_date));
      payload.required_hours = this.calculateWorkingHours(new Date(data.start_date), new Date(data.due_date));
    }
    const milestone = await ProjectMilestone.create({ ...payload, project_id: project.id, team_configured: true }, { transaction });
    await this.calculateAndSyncPayments(milestone, transaction);
    return this.milestoneRepo.findById(milestone.id, transaction);
  });
}

async updateMilestone(id: number, data: CreateProjectMilestoneDto, authUser: any) {
  const existing = await this.milestoneRepo.findById(id);
  if (!existing || existing.deleted_at) throw new NotFoundException('Milestone not found');
  const payload = this.milestoneFields(data);
  if (data.project_id !== undefined && Number(data.project_id) !== Number(existing.project_id))
    throw new BadRequestException('Milestones cannot be moved between projects');
  return this.teamBuilder.locked(existing.project_id, authUser, async (_project, transaction) => {
    const milestone = await ProjectMilestone.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!milestone || milestone.deleted_at) throw new NotFoundException('Milestone not found');
    if (await this.paymentRepo.hasPaidByMilestoneId(id, transaction))
      throw new ConflictException('Paid milestones are immutable');
    const start = data.start_date === undefined ? milestone.start_date : data.start_date;
    const due = data.due_date === undefined ? milestone.due_date : data.due_date;
    if (start && due) {
      await this.validateMilestoneDates(milestone.project_id, new Date(start), new Date(due), id);
      if (data.start_date !== undefined || data.due_date !== undefined)
        payload.required_hours = this.calculateWorkingHours(new Date(start), new Date(due));
    }
    await milestone.update(payload, { transaction });
    await this.calculateAndSyncPayments(milestone, transaction);
    return this.milestoneRepo.findById(milestone.id, transaction);
  });
}
  async getConsultantMonthlyBills(projectId: number, userId: number, authUser: any) {
  await this.assertProjectAccess(projectId, authUser);
  if (Number(authUser?.role) === UserRole.CONSULTANT && Number(authUser?.id) !== userId) {
    throw new ForbiddenException('Consultants can only view their own bills');
  }
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
      where: { project_id: id, deleted_at: null }
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
    const existing = await this.milestoneRepo.findById(id);
    if (!existing || existing.deleted_at) throw new NotFoundException('Milestone not found');
    return this.teamBuilder.locked(existing.project_id, authUser, async (_project, transaction) => {
      const milestone = await ProjectMilestone.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!milestone || milestone.deleted_at) throw new NotFoundException('Milestone not found');
      if (await this.paymentRepo.hasPaidByMilestoneId(id, transaction))
        throw new ConflictException('A paid milestone cannot be deleted');
      await milestone.update({ deleted_at: new Date() }, { transaction });
      if (milestone.team_configured) await this.calculateAndSyncPayments(milestone, transaction);
      else await ProjectPayment.update({ deleted_at: new Date() }, {
        where: { project_milestone_id: id, is_paid: false, deleted_at: null }, transaction,
      });
      return milestone.reload({ transaction });
    });
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
      where: { project_id: projectId, deleted_at: null },
    });
  }

  async updatePayment(paymentId: number, data: UpdateProjectPaymentDto, authUser: any) {
    const existing = await this.paymentRepo.findById(paymentId);
    if (!existing || existing.deleted_at) throw new NotFoundException('Payment not found');
    return this.teamBuilder.locked(existing.project_id, authUser, async (_project, transaction) => {
      const payment = await ProjectPayment.findByPk(paymentId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!payment || payment.deleted_at) throw new NotFoundException('Payment not found');
      if (payment.is_paid) throw new ConflictException('Paid payment records are immutable');
      const allowed = new Set(['project_id', 'project_milestone_id', 'doc_id', 'amount', 'payment_module', 'is_paid']);
      if (Object.keys(data).some(key => !allowed.has(key))) throw new BadRequestException('Unknown payment field');
      if (data.project_id !== undefined && Number(data.project_id) !== payment.project_id)
        throw new BadRequestException('A payment cannot be moved to another project');
      if (data.project_milestone_id !== undefined && Number(data.project_milestone_id) !== payment.project_milestone_id)
        throw new BadRequestException('A payment cannot be moved to another milestone');
      if (data.is_paid !== undefined && typeof data.is_paid !== 'boolean')
        throw new BadRequestException('is_paid must be boolean');
      const payload: any = {};
      if (data.doc_id !== undefined) {
        if (data.doc_id !== null && (!Number.isSafeInteger(Number(data.doc_id)) || Number(data.doc_id) <= 0))
          throw new BadRequestException('doc_id must be a positive integer or null');
        payload.doc_id = data.doc_id === null ? null : Number(data.doc_id);
      }
      if (data.amount !== undefined) {
        if (!Number.isFinite(Number(data.amount)) || Number(data.amount) < 0)
          throw new BadRequestException('amount must be finite and nonnegative');
        payload.amount = Number(data.amount);
      }
      if (data.payment_module !== undefined) payload.payment_module = data.payment_module;
      if (data.is_paid !== undefined) payload.is_paid = data.is_paid;
      if (!Object.keys(payload).length) throw new BadRequestException('At least one payment field is required');
      // Database guard checks server-calculated amounts and serializes settlement
      // with allocation saves. Marking paid continues through this existing flow.
      await payment.update(payload, { transaction });
      return payment.reload({ transaction });
    });
  }

}
