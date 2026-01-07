import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User } from '../../models/user.model';
import { UserRepository } from 'repository/user.repository';
import { ProjectRepository } from 'repository/project.repository';
import { ProjectPaymentRepository} from 'repository/project-payment.repository';

@Injectable()
export class ClientService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository,
    private readonly projectPaymentRepository: ProjectPaymentRepository,
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
  async getAllClientStats(id: number) {
    return {
      "dashboard": {
            "appeared_in_search": 3,
            "interview_schedule": 0,
            "projected_monthly_revenue": 300,
            "total_earnings": 300
        },
        "projects_stats": {
            "current": {
                "project": "Test Proj 1 ",
                "employeer": "client 12",
                "project_info": "Tue Nov 10 2026 \n to Fri Dec 11 2026,\n Role: senior"
            },
            "upcoming": {
                "project": "N/A",
                "employeer": "N/A",
                "project_info": "N/A"
            },
            "task": {
                "total": 10,
                "pending": 0
            }
        },
        "meetings_stats": {
            "interview_requests": 1,
            "upcoming_interviews": 0,
            "rescheduled_interviews": 1,
            "cancelled_interviews": 0
        }
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
      due_date: '2026-02-28T14:30:00.000Z',
    }));
    return paymentsWithDueDate;

  }

}
