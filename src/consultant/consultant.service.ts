import { Injectable } from '@nestjs/common';
import { CreateConsultantDto } from './dto/create-consultant.dto';
import { UpdateConsultantDto } from './dto/update-consultant.dto';
import { GetConsultantDto } from './dto/get-consultant.dto';
import * as bcrypt from 'bcrypt';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { getConsultantProjectsResponse } from './transformer/consultant.transformer';
import { ConsultantRepository } from 'repository/consultant.repository';

@Injectable()
export class ConsultantService {
  constructor(
      private readonly projectConsultantRepo: ProjectConsultantRepository,
      private readonly consultantRepository: ConsultantRepository,
    ) {}
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
  
  
  async getProjectByConsultantId(id: number) {
    let consultantProjectsList = await this.projectConsultantRepo.findByConsultantId(id);

    const consultantProjects = getConsultantProjectsResponse(consultantProjectsList);

    return consultantProjects;
  }
  
  
  async getScheduleByConsultantId(id: number) {
    const booking_schedule = await this.projectConsultantRepo.findBookingScheduleByConsultantId(id);
    const consultant_schedule = await this.consultantRepository.findByUserId(id);

    return {booking_schedule, consultant_schedule};
  }
  
  async getConsultantPayments(id: number) {

    return [
        {
            "id": "1",
            "project_id": "1",
            "project_milestone_id": null,
            "doc_id": null,
            "amount": 200,
            "payment_module": "custom",
            "is_paid": false,
            "deleted_at": null,
            "project": {
                "id": "1",
                "name": "p1",
                "consultant_id": id,
                "company_name": "ABC test",
                "status": "initiated",
                "deleted_at": null
            },
            "due_date": "2026-02-28T14:30:00.000Z"
        }
    ];
  }
}
