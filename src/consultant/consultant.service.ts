import { Injectable } from '@nestjs/common';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { GetConsultantDto } from './dto/get-consultant.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ConsultantService {
  private consultants: GetConsultantDto[] = [
    {id: 1, name: 'Alice Khan', email: 'alice@example.com', expertise: 'FrontendDeveloper',password:"" },
    { id: 2, name: 'Bob Ahmed', email: 'bob@example.com', expertise: 'Backend Developer',password:"" },
  ];

  async create(dto: CreateConsultantDto) {
    if (!dto.password) {
      throw new Error('Password is required');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newConsultant: GetConsultantDto = {
      id: Date.now(),
      ...dto,
      password: hashedPassword,
    };

    this.consultants.push(newConsultant);
    return newConsultant;
  }

  findAll(): GetConsultantDto[] {
    return this.consultants;
  }

  findOne(id: number): GetConsultantDto | undefined {
    return this.consultants.find((c) => c.id === id);
  }

  update(id: number, dto: UpdateConsultantDto): GetConsultantDto | null {
    const index = this.consultants.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.consultants[index] = { ...this.consultants[index], ...dto };
    return this.consultants[index];
  }

  remove(id: number) {
    this.consultants = this.consultants.filter((c) => c.id !== id);
    return { deleted: true };
  }
}
