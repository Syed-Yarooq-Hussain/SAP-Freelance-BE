import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { UserRepository } from 'repository/user.repository';
import { getAdminsClientResponse, getAdminsConsultantResponse, getAdminsProjectResponse } from './transformer/response.transformer';
import { ProjectRepository } from 'repository/project.repository';
import { IndustriesRepository } from 'repository/indutries.repository';
import { ProjectPaymentRepository } from 'repository/project-payment.repository';
import { ConsultantMonthlyBillRepository } from 'repository/consultant-monthly-bill.repository';
import { User } from 'models/user.model';
import { Project } from 'models/project.model';
import { Meeting } from 'models/meeting.model';
import { ProjectPayment } from 'models/project-payment.model';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { Op } from 'sequelize';
import { EmailType, MeetingStatus, MeetingType, ProjectStatus, UserRole, UserStatus } from 'constant/enums';
import { Consultant } from 'models/consultant.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { ModuleRequest } from 'models/module-request.model';
import { Sequelize } from 'sequelize-typescript';
import { col, fn, where } from 'sequelize';
import { DecideModuleRequestDto } from './dto/decide-module-request.dto';
import { EmailDispatch } from 'models/email-dispatch.model';
import { SendInviteEmailsDto } from './dto/send-invite-emails.dto';
import { sendConsultantInvitationEmail } from 'src/common/emails/email.util';
import { ConsultantService } from 'src/consultant/consultant.service';

@Injectable()
export class AdminService {
  constructor(
    private userRepo: UserRepository,
    private projectRepo: ProjectRepository,
    private industriesRepo: IndustriesRepository,
    private projectPaymentRepo: ProjectPaymentRepository,
    private monthlyBillRepo: ConsultantMonthlyBillRepository,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Project)
    private projectModel: typeof Project,
    @InjectModel(Meeting)
    private meetingModel: typeof Meeting,
    @InjectModel(ProjectPayment)
    private projectPaymentModel: typeof ProjectPayment,
    @InjectModel(ConsultantMonthlyBill)
    private consultantMonthlyBillModel: typeof ConsultantMonthlyBill,
    @InjectModel(ModuleRequest)
    private moduleRequestModel: typeof ModuleRequest,
    @InjectModel(ModuleEntity)
    private moduleModel: typeof ModuleEntity,
    @InjectConnection()
    private sequelize: Sequelize,
    @InjectModel(EmailDispatch)
    private emailDispatchModel: typeof EmailDispatch,
    private consultantService: ConsultantService,
  ) {}

  async getConsultantProfileByUserId(userId: number) {
    if (!Number.isInteger(userId) || userId < 1) {
      throw new BadRequestException('Consultant user ID must be a positive integer');
    }
    const profile = await this.consultantService.getConsultantDetail(userId);
    if (!profile) throw new NotFoundException('Consultant profile not found');
    return {
      message: 'Consultant profile fetched successfully',
      data: profile,
    };
  }

  private assertAdmin(authUser: any) {
    if (Number(authUser?.role) !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can manage module requests');
    }
  }

  async getModuleRequests(authUser: any) {
    this.assertAdmin(authUser);
    const requests = await this.moduleRequestModel.findAll({
      include: [{
        model: User,
        attributes: ['id', 'username', 'email'],
      }],
      order: [['created_at', 'DESC']],
    });
    return { message: 'Module requests fetched', data: requests };
  }

  async decideModuleRequest(
    authUser: any,
    requestId: string,
    body: DecideModuleRequestDto,
  ) {
    this.assertAdmin(authUser);
    if (!/^\d+$/.test(String(requestId)) || Number(requestId) < 1) {
      throw new BadRequestException('Module request id must be a positive integer');
    }
    if (
      !body ||
      Object.keys(body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(body, 'is_accepted') ||
      typeof body.is_accepted !== 'boolean'
    ) {
      throw new BadRequestException('is_accepted must be either true or false');
    }

    const accepted = body.is_accepted;
    const request = await this.sequelize.transaction(async transaction => {
      const pendingRequest = await this.moduleRequestModel.findByPk(Number(requestId), {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!pendingRequest) throw new NotFoundException('Module request not found');
      if (pendingRequest.is_accepted !== null) {
        throw new ConflictException('Module request has already been processed');
      }

      if (accepted) {
        const normalizedName = pendingRequest.name.trim().toLowerCase();
        await this.sequelize.query(
          'SELECT pg_advisory_xact_lock(hashtext(:moduleName))',
          { replacements: { moduleName: normalizedName }, transaction },
        );
        const existingModule = await this.moduleModel.findOne({
          where: {
            deleted_at: null,
            [Op.and]: [where(fn('lower', col('name')), normalizedName)],
          },
          transaction,
        });
        if (existingModule) {
          throw new ConflictException('Module already exists');
        }

        await this.moduleModel.create({
          name: pendingRequest.name.trim(),
          abbreviation: null,
          is_core: false,
          parent_id: null,
        }, { transaction });
      }

      pendingRequest.is_accepted = accepted;
      await pendingRequest.save({ transaction });
      return pendingRequest;
    });

    return {
      message: accepted ? 'Module request accepted' : 'Module request rejected',
      data: request,
    };
  }

  async sendInviteEmails(authUser: any, body: SendInviteEmailsDto) {
    this.assertAdmin(authUser);
    if (
      !body ||
      Object.keys(body).length !== 1 ||
      !Object.prototype.hasOwnProperty.call(body, 'emails') ||
      typeof body.emails !== 'string'
    ) {
      throw new BadRequestException('emails must be a comma-separated string');
    }

    const emails = Array.from(new Set(
      body.emails
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean),
    ));
    if (!emails.length) {
      throw new BadRequestException('At least one email address is required');
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailPattern.test(email));
    if (invalidEmails.length) {
      throw new BadRequestException(
        `Invalid email address${invalidEmails.length > 1 ? 'es' : ''}: ${invalidEmails.join(', ')}`,
      );
    }

    const sent: EmailDispatch[] = [];
    const failed: { email: string; error: string }[] = [];

    console.log('[AdminService] Starting consultant invite email batch', {
      adminId: authUser.id,
      recipientCount: emails.length,
    });

    // Deliberately sequential to avoid bursting the mail provider.
    for (const email of emails) {
      try {
        const providerMessageId = await sendConsultantInvitationEmail(email);
        const record = await this.emailDispatchModel.create({
          email,
          email_type: EmailType.INVITE,
          provider_message_id: providerMessageId,
          sent_by: Number(authUser.id),
          sent_at: new Date(),
        });
        sent.push(record);
        console.log('[AdminService] Consultant invite email sent', {
          email,
          providerMessageId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : 'Email delivery failed';
        console.error('[AdminService] Consultant invite email failed', {
          email,
          error: errorMessage,
        });
        failed.push({
          email,
          error: errorMessage,
        });
      }
    }

    console.log('[AdminService] Consultant invite email batch completed', {
      total: emails.length,
      sent: sent.length,
      failed: failed.length,
    });

    return {
      message: failed.length
        ? 'Invite email processing completed with some failures'
        : 'Invite emails sent successfully',
      data: {
        total: emails.length,
        sent_count: sent.length,
        failed_count: failed.length,
        sent,
        failed,
      },
    };
  }

  private getCurrentWeekRange() {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return { start, end };
  }

  private toAmount(value: unknown): number {
    return Number(value || 0);
  }

  private toChartData(values: Map<string, number>) {
    return Array.from(values.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }

  private incrementBreakdown(values: Map<string, number>, label: unknown) {
    const normalizedLabel = String(label || '').trim() || 'Unspecified';
    values.set(normalizedLabel, (values.get(normalizedLabel) || 0) + 1);
  }

  private getExperienceLevel(consultant: Consultant): string {
    const configuredLevel = consultant.expertise_level || consultant.level;
    if (configuredLevel) return configuredLevel;

    const experience = Number(consultant.experience);
    if (!Number.isFinite(experience)) return 'Unspecified';
    if (experience < 1) return 'Junior';
    if (experience < 3) return 'Associate';
    if (experience < 6) return 'Mid-Level';
    if (experience < 9) return 'Senior';
    if (experience < 12) return 'Principal';
    return 'Solution Architect';
  }

  async getConsultantsSummary() {
    const consultants = await this.userModel.findAll({
      where: {
        role: UserRole.CONSULTANT,
        deleted_at: null,
      },
      attributes: [
        'id',
        'country',
        'status',
        'email_verified',
        'phone_verified',
        'linkedin_sso_connected',
      ],
      include: [
        {
          model: Consultant,
          required: true,
          where: { deleted_at: null },
          attributes: [
            'rate',
            'weekly_available_hours',
            'experience',
            'level',
            'expertise_level',
            'is_certified',
          ],
        },
        {
          model: ConsultantModule,
          required: false,
          where: { deleted_at: null },
          attributes: ['module_id'],
          include: [
            {
              model: ModuleEntity,
              required: false,
              where: { deleted_at: null },
              attributes: ['name'],
            },
          ],
        },
      ],
    });

    const modules = new Map<string, number>();
    const experienceLevels = new Map<string, number>();
    const countries = new Map<string, number>();
    const profileStatuses = new Map<string, number>();
    let rateTotal = 0;
    let rateCount = 0;
    let availabilityTotal = 0;
    let availabilityCount = 0;
    let verifiedProfiles = 0;
    let certifiedProfiles = 0;
    let pendingProfiles = 0;

    for (const user of consultants) {
      const consultant = user.consultants;
      const rate = Number(consultant?.rate);
      const availability = Number(consultant?.weekly_available_hours);

      if (Number.isFinite(rate) && rate >= 0) {
        rateTotal += rate;
        rateCount += 1;
      }
      if (Number.isFinite(availability) && availability >= 0) {
        availabilityTotal += availability;
        availabilityCount += 1;
      }

      const isVerified = Boolean(
        user.email_verified ||
        user.phone_verified ||
        user.linkedin_sso_connected
      );

      if (isVerified) {
        verifiedProfiles += 1;
      }
      if (consultant?.is_certified) certifiedProfiles += 1;

      const status = String(user.status || 'Unspecified').toLowerCase();
      if (status === UserStatus.PENDING) pendingProfiles += 1;

      this.incrementBreakdown(experienceLevels, this.getExperienceLevel(consultant));
      this.incrementBreakdown(countries, user.country);
      this.incrementBreakdown(
        profileStatuses,
        isVerified ? 'Verified' : 'Unverified',
      );

      for (const consultantModule of user.modules || []) {
        if (consultantModule.module?.name) {
          this.incrementBreakdown(modules, consultantModule.module.name);
        }
      }
    }

    const roundAverage = (total: number, count: number) =>
      count ? Math.round((total / count) * 100) / 100 : 0;

    return {
      message: 'Consultant summary fetched successfully',
      data: {
        total_resources: consultants.length,
        avg_hourly_rate: roundAverage(rateTotal, rateCount),
        avg_weekly_availability_hours: roundAverage(
          availabilityTotal,
          availabilityCount,
        ),
        verified_profiles: verifiedProfiles,
        certified_profiles: certifiedProfiles,
        pending_profiles: pendingProfiles,
        modules_breakdown: this.toChartData(modules),
        experience_level_breakdown: this.toChartData(experienceLevels),
        countries_breakdown: this.toChartData(countries),
        profile_status_breakdown: this.toChartData(profileStatuses),
      },
    };
  }

  async dashboardStatistic() {
    const { start, end } = this.getCurrentWeekRange();

    const [
      totalConsultants,
      totalClients,
      activeConsultants,
      activeClients,
      pendingConsultantApprovals,
      pendingClientApprovals,
      totalProjects,
      activeProjects,
      upcomingProjects,
      completedProjects,
      cancelledProjects,
      interviewThisWeek,
      pendingInterviews,
      paidClientRevenue,
      pendingClientRevenue,
      paidConsultantBills,
      pendingConsultantBills,
    ] = await Promise.all([
      this.userModel.count({ where: { role: UserRole.CONSULTANT, deleted_at: null } }),
      this.userModel.count({ where: { role: UserRole.CLIENT, deleted_at: null } }),
      this.userModel.count({ where: { role: UserRole.CONSULTANT, status: UserStatus.ACTIVE, deleted_at: null } }),
      this.userModel.count({ where: { role: UserRole.CLIENT, status: UserStatus.ACTIVE, deleted_at: null } }),
      this.userModel.count({ where: { role: UserRole.CONSULTANT, status: UserStatus.PENDING, deleted_at: null } }),
      this.userModel.count({ where: { role: UserRole.CLIENT, status: UserStatus.PENDING, deleted_at: null } }),
      this.projectModel.count({ where: { deleted_at: null } }),
      this.projectModel.count({
        where: {
          deleted_at: null,
          status: {
            [Op.in]: [
              ProjectStatus.IN_PROGRESS,
              ProjectStatus.ON_HOLD,
              ProjectStatus.UNDER_REVIEW,
            ],
          },
        },
      }),
      this.projectModel.count({
        where: {
          deleted_at: null,
          status: { [Op.in]: ['pending', ProjectStatus.INITIATED] },
        },
      }),
      this.projectModel.count({ where: { deleted_at: null, status: ProjectStatus.COMPLETED } }),
      this.projectModel.count({ where: { deleted_at: null, status: ProjectStatus.CANCELLED } }),
      this.meetingModel.count({
        where: {
          deleted_at: null,
          event_type: MeetingType.INTERVIEW,
          date_time: { [Op.gte]: start, [Op.lt]: end },
        },
      }),
      this.meetingModel.count({
        where: {
          deleted_at: null,
          event_type: MeetingType.INTERVIEW,
          status: MeetingStatus.PENDING,
        },
      }),
      this.projectPaymentModel.sum('amount', { where: { deleted_at: null, is_paid: true } }),
      this.projectPaymentModel.sum('amount', { where: { deleted_at: null, is_paid: false } }),
      this.consultantMonthlyBillModel.sum('amount', { where: { is_paid: true } }),
      this.consultantMonthlyBillModel.sum('amount', { where: { is_paid: false } }),
    ]);

    return {
        total_consultants: totalConsultants,
        total_clients: totalClients,
        active_consultants: activeConsultants,
        active_clients: activeClients,
        active_projects: activeProjects,
        upcoming_projects: upcomingProjects,
        pending_consultant_approvals: pendingConsultantApprovals,
        interview_this_week: interviewThisWeek,
        total_projects: totalProjects,
        pending_client_approvals: pendingClientApprovals,
        completed_projects: completedProjects,
        cancelled_projects: cancelledProjects,
        pending_interviews: pendingInterviews,
        client_paid_revenue: this.toAmount(paidClientRevenue),
        client_pending_revenue: this.toAmount(pendingClientRevenue),
        consultant_paid_bills: this.toAmount(paidConsultantBills),
        consultant_pending_bills: this.toAmount(pendingConsultantBills),
    }
  }


  async getAllConsultant(status: string) {
    const consultantList =  await this.userRepo.findAllUsersWithConsultants(status);
    let consultants = getAdminsConsultantResponse(consultantList);
    return consultants;
  }

  async accpetRejectConsultantById(id: number, body: any) {
    const consultant = await this.userRepo.findById(id);

    if (!consultant) {
      throw new Error('Consultant not found');
    }
    consultant.status = body.status;
    await consultant.save();
    return consultant;
  }
  
  async getAllClients(status: string) {
    let clientsResponse = await this.userRepo.getAllClientsWithProjectstatus(status);
    return getAdminsClientResponse(clientsResponse);
  }
  
  async getAllProjects() {
    let projects = await this.projectRepo.findAllforAdmin();
    return getAdminsProjectResponse(projects);
  }

  async getAllPayments() {
    const [clientPayments, consultantPayments] = await Promise.all([
      this.projectPaymentRepo.findAllForAdmin(),
      this.monthlyBillRepo.findAllForAdmin(),
    ]);

    return {
      client_payments: clientPayments,
      consultant_payments: consultantPayments,
    };
  }

  async getConsultantPayments(userId?: number) {
    if (userId) {
      return this.monthlyBillRepo.findByConsultant(userId);
    }

    return this.monthlyBillRepo.findAllForAdmin();
  }

  async markConsultantPaymentPaid(id: number, body: { pdf_url?: string }) {
    const bill = await this.monthlyBillRepo.findById(id);
    if (!bill) {
      throw new NotFoundException('Consultant payment not found');
    }

    await this.monthlyBillRepo.markPaid(id, body?.pdf_url || null);

    return {
      message: 'Consultant payment marked as paid',
      id,
    };
  }

  // 🏭 Industries CRUD Operations
  async createIndustry(name: string) {
    const newIndustry = await this.industriesRepo.create({ name });
    return {
      message: 'Industry created successfully',
      data: newIndustry
    };
  }

  async getAllIndustries() {
    const industries = await this.industriesRepo.findAll();
    return {
      message: 'Industries fetched successfully',
      data: industries
    };
  }

  async getIndustryById(id: number) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      throw new Error('Industry not found');
    }
    return {
      message: 'Industry fetched successfully',
      data: industry
    };
  }

  async updateIndustry(id: number, name: string) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      throw new Error('Industry not found');
    }
    const [, updatedIndustries] = await this.industriesRepo.update(id, { name });
    return {
      message: 'Industry updated successfully',
      data: updatedIndustries[0]
    };
  }

  async deleteIndustry(id: number) {
    const industry = await this.industriesRepo.findById(id);
    if (!industry) {
      throw new Error('Industry not found');
    }
    const deletedCount = await this.industriesRepo.delete(id);
    return {
      message: 'Industry deleted successfully',
      deletedCount
    };
  }
}
