import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User } from '../../models/user.model';
import { UserRepository } from 'repository/user.repository';
import { ProjectRepository } from 'repository/project.repository';
import { ProjectPaymentRepository} from 'repository/project-payment.repository';
import { GetClientConsultantsQueryDto } from './dto/get-consultants-query.dto';
import { MeetingRepository } from 'repository/meeting.repository';

@Injectable()
export class ClientService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectPaymentRepository: ProjectPaymentRepository,
    private readonly meetingRepository: MeetingRepository,
    @InjectModel(User)
    private userModel: typeof User
  ) { }
  // 🧩 Dummy Clients
  private clients = [
    { id: 1, name: 'Client A', email: 'a@example.com' },
    { id: 2, name: 'Client B', email: 'b@example.com' },
  ];

 
  // ✅ Create Client
  create(dto: CreateClientDto) {
    const newClient = { id: Date.now(), ...dto };
    this.clients.push(newClient);
    return newClient;
  }

  // ✅ Get All Clients
  findAll() {
    return this.clients;
  }

  async getClient(id: number) {
    return await this.userRepository.findById(id);
  }
  private toAmount(value: any) {
    const amount = Number(value);
    return Number.isNaN(amount) ? 0 : amount;
  }

  async getAllClientStats(id: number) {
    const [projects, payments, meetings] = await Promise.all([
      this.projectRepository.findAllByClient(id),
      this.projectPaymentRepository.projectPaymentsByClientId(id),
      this.meetingRepository.getMeetingWithDetails(id, 'interview'),
    ]);

    const activePayments = (payments || []).filter(payment => !payment.deleted_at);
    const paidPayments = activePayments.filter(payment => payment.is_paid === true);
    const unpaidPayments = activePayments.filter(payment => payment.is_paid === false);
    const now = new Date();

    const meetings_stats = {
      interview_requests: meetings.length,
      upcoming_interviews: meetings.filter(
        meeting => meeting.status === 'Pending' && new Date(meeting.date_time) > now,
      ).length,
      rescheduled_interviews: meetings.filter(
        meeting => meeting.status === 'Rescheduled',
      ).length,
      cancelled_interviews: meetings.filter(
        meeting => meeting.status === 'Cancelled',
      ).length,
    };

    return {
      "dashboard": {
            "number_of_project": projects.length,
            "interview_schedule": meetings_stats.upcoming_interviews,
            "total_spend_on_project": paidPayments.reduce(
              (sum, payment) => sum + this.toAmount(payment.amount),
              0,
            ),
            "pending_invoices": unpaidPayments.reduce(
              (sum, payment) => sum + this.toAmount(payment.amount),
              0,
            )
        },
        "meetings_stats": meetings_stats
    }
  }

  // ✅ Update Client
  update(id: number, dto: UpdateClientDto) {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.clients[index] = { ...this.clients[index], ...dto };
    return this.clients[index];
  }

  // ✅ Remove Client
  remove(id: number) {
    this.clients = this.clients.filter((c) => c.id !== id);
    return { deleted: true };
  }

  // ✅ Get All Consultants
  private toNumber(value?: string | number) {
    return value === undefined || value === null || value === '' ? undefined : Number(value);
  }

  async getAllConsultants(query: GetClientConsultantsQueryDto) {
    const consultants = await this.userRepository.findAllUsersWithConsultants(undefined, {
      module_id: this.toNumber(query.module_id),
      experience: this.toNumber(query.experience),
      available_hours: this.toNumber(query.available_hours),
      min_rate: this.toNumber(query.min_rate),
      max_rate: this.toNumber(query.max_rate),
      country: query.country,
    });
    let consultantList = [];
    for(const consultant of consultants){
      let modules = {core:'',others:''};
      for(const mod of consultant.modules){
        if(mod.module.is_core) 
          modules.core += mod.module.name + ', ';
        else 
          modules.others += mod.module.name + ' ';
      }
      consultantList.push({
        id: consultant.id,
        name: consultant.username,
        country: consultant.country,
        experience: consultant.consultants.experience,
        rate: consultant.consultants.rate,
        weekly_available_hours: consultant.consultants.weekly_available_hours,
        working_schedule: consultant.consultants.working_schedule,
        modules,
        project_name: consultant?.projects[0]?.id ?? 'N/A',
        project_id: consultant?.projects[0]?.name ?? 'N/A',
      });
    }
    return consultantList;
  }

  

  async getAllProjectByClientId(user_id: number) {
    let projects = await this.projectRepository.findAllByClient(user_id);
     const projectsWithMembers = projects.map(project => ({
      ...project,
      members: 3,
    }));

    return projectsWithMembers;
  }


  async getAllProjectsPaymentsByClientId(client_id: number) {
    let payments= await this.projectPaymentRepository.projectPaymentsByClientId(client_id);
    const paymentsWithDueDate = payments.map(payments => ({
      ...payments,
      due_date: payments?.milestone?.start_date ?? null,
    }));
    return paymentsWithDueDate;

  }

}
