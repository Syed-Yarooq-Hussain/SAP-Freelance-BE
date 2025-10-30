import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { User } from '../../models/user.model';
import { UserRepository } from 'repository/user.repository';

@Injectable()
export class ClientService {
   constructor(
    private readonly userRepository: UserRepository,
    @InjectModel(User)
    private userModel: typeof User
  ) {}
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

  // ✅ Get client by ID
  findOne(id: number) {
    return this.clients.find((client) => client.id === id);
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
  return consultants;
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
