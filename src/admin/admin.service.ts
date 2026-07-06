import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
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
import { MeetingStatus, MeetingType, ProjectStatus, UserRole, UserStatus } from 'constant/enums';

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
  ) {}

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
