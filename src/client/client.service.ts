import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User } from '../../models/user.model';
import { UserRepository } from 'repository/user.repository';
import { url } from 'inspector';

@Injectable()
export class ClientService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectModel(User)
    private userModel: typeof User
  ) { }
  // 🧩 Dummy Clients
  private clients = [
    { id: 1, name: 'Client A', email: 'a@example.com' },
    { id: 2, name: 'Client B', email: 'b@example.com' },
  ];

  // 🧩 Dummy Consultants (linked with clients)
  private consultants = [
    { id: 1, name: 'Consultant Alpha', expertise: 'SAP HANA', clientId: 1, experience: 5, rate: 100 },
    { id: 2, name: 'Consultant Beta', expertise: 'SAP FICO', clientId: 1, experience: 3, rate: 80 },
    { id: 3, name: 'Consultant Gamma', expertise: 'SAP MM', clientId: 2, experience: 6, rate: 120 },
    { id: 4, name: 'Consultant Delta', expertise: 'SAP ABAP', clientId: 2, experience: 4, rate: 90 },
  ];

  // ✅ Create new client
  create(dto: CreateClientDto) {
    const newClient = { id: Date.now(), ...dto };
    this.clients.push(newClient);
    return newClient;
  }

  // ✅ Get all clients
  findAll() {
    return this.clients;
  }

  async findOne(id: number) {
  const user = await this.userRepository.fetchClientDashboardData(id);

  if (!user) throw new NotFoundException("User not found");

  const plain = user.toJSON();

  // -------------------------
  // Extract payments
  // -------------------------
  const allPayments = [];
  for (const project of plain.projects) {
    if (project.payments?.length) {
      project.payments.forEach(p => {
        allPayments.push({
          id: p.id,
          amount: p.amount,
          is_paid: p.is_paid,
          project_id: project.id,
          project_name: project.name,
        });
      });
    }
  }

  // -------------------------
  // Calendar
  // -------------------------
  const sentMeetings = (plain.sentMeetings || []).map(m => ({
    id: m.id,
    date_time: m.date_time,
    duration: m.duration,
    event_type: m.event_type,
    status: m.status,
    url: m.url,
    participants: m.invitees.map(i => i.user_id)
  }));

  const receivedMeetings = (plain.receivedInvites || []).map(inv => ({
    id: inv.meeting.id,
    date_time: inv.meeting.date_time,
    duration: inv.meeting.duration,
    event_type: inv.meeting.event_type,
    status: inv.meeting.status,
    participants: inv.meeting.invitees.map(i => i.user_id),
  }));

  const calendar = [...sentMeetings, ...receivedMeetings].sort(
    (a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()
  );

  // -------------------------
  // Project formatting
  // -------------------------
  const projects = plain.projects.map(project => ({
    id: project.id,
    name: project.name,
    company_name: project.company_name,
    status: project.status,
    projectDetails: project.projectDetails,
    projectIndustries: project.projectIndustries,
    projectConsultants: project.projectConsultants.map(c => ({
      id: c.id,
      consultant_id: c.consultant_id,
      status: c.status,
      role: c.role,
      decided_rate: c.decided_rate,
      requested_hours: c.requested_hours,
      is_doc_signed: c.is_doc_signed,
    })),
    payments: project.payments.map(p => ({
      id: p.id,
      amount: p.amount,
      is_paid: p.is_paid,
      project_name: project.name
    }))
  }));

  let statistic = {
    numberOfProjects: projects.length,
    meetingScheduled: calendar.length,
    totalSpendingOnProject: 36,
    totalPendingInvoices: 3600

  }
  return {
    ...plain,
    projects,
    allPayments,
    calendar,
    statistic
  };
}


  // ✅ Update client
  update(id: number, dto: UpdateClientDto) {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.clients[index] = { ...this.clients[index], ...dto };
    return this.clients[index];
  }

  // ✅ Remove client
  remove(id: number) {
    this.clients = this.clients.filter((c) => c.id !== id);
    return { deleted: true };
  }

  // ✅ Get all consultants
  async getAllConsultants() {
    const consultants = await this.userRepository.findAllUsersWithConsultants();
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
        experience: consultant.consultants.experience,
        rate: consultant.consultants.rate,
        weekly_available_hours: consultant.consultants.weekly_available_hours,
        working_schedule: consultant.consultants.working_schedule,
        modules
      });
    }
    return consultantList;
  }

  // ✅ Get consultant by ID
  getConsultantById(id: number) {
    const consultant = this.consultants.find((c) => c.id === id);
    if (!consultant) {
      return { message: `Consultant with ID ${id} not found` };
    }
    return consultant;
  }
}
