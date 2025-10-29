import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Consultant } from '../models/consultant.model';
import { CreateConsultantDetailDto } from 'src/user/dto/create-consultant-detail.dto';

@Injectable()
export class ConsultantRepository {
  constructor(
    @InjectModel(Consultant)
    private readonly consultantModel: typeof Consultant,
  ) {}

  // 🟢 Create new consultant detail
async createDetail(dto: any, userId: number) {
  return this.consultantModel.create({
    user_id: userId,
    module: dto.module,
    experience: dto.experience,
    rate: dto.rate,
    weekly_available_hours: dto.weekly_available_hours,
  });
}

  // 📋 Get all consultants
  async findAll(): Promise<Consultant[]> {
    return this.consultantModel.findAll();
  }

  // 🔍 Get consultant by ID
  async findById(id: number): Promise<Consultant | null> {
    return this.consultantModel.findByPk(id);
  }

  // 🔎 Get consultant by user ID
  async findByUserId(userId: number): Promise<Consultant | null> {
    return this.consultantModel.findOne({ where: { user_id: userId } });
  }

  // 🧠 Update consultant
  async update(id: number, data: Partial<Consultant>): Promise<[number, Consultant[]]> {
    return this.consultantModel.update(data, { where: { id }, returning: true });
  }

  // ❌ Delete consultant
  async delete(id: number): Promise<number> {
    return this.consultantModel.destroy({ where: { id } });
  }
}
