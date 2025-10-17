import { Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../models/user.model';  // <-- Adjust path if different

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(User)
    private readonly userModel:typeof User,
  ) {}

  private clients = [
    { id: 1, name: 'Client A', email: 'a@example.com' },
    { id: 2, name: 'Client B', email: 'b@example.com' },
  ];

  create(dto: CreateClientDto) {
    const newClient = { id: Date.now(), ...dto };
    this.clients.push(newClient);
    return newClient;
  }

  findAll() {
    return this.clients;
  }

  findOne(id: number) {
    return this.clients.find((client) => client.id === id);
  }

  update(id: number, dto: UpdateClientDto) {
    const index = this.clients.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.clients[index] = { ...this.clients[index], ...dto };
    return this.clients[index];
  }

  remove(id: number) {
    this.clients = this.clients.filter((c) => c.id !== id);
    return { deleted: true };
  }

  // ✅ NEW SERVICE METHOD
  async findConsultantById(id: number) {
    // Example: fetch all users where id = 1 (you can change this to any condition)
    return this.userModel.findOne({
      where: { id},
    });
  }
}
