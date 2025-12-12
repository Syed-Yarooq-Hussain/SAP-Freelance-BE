import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Consultant } from '../models/consultant.model';

@Injectable()
export class ConsultantRepository {
  constructor(
    @InjectModel(Consultant)
    private readonly consultantModel: typeof Consultant,
  ) {}

  // 🟢 Create Consultant Detail
async createDetail(dto: any, userId: number) {
  return this.consultantModel.create({
    user_id: userId,
    experience: dto.experience,
    rate: dto.rate,
    weekly_available_hours: dto.weekly_available_hours,
  });
}

  // 📋 Get All Consultants
  async findAll(): Promise<Consultant[]> {
    return this.consultantModel.findAll();
  }

  // 🔍 Get Consultant By Id
  async findById(id: number): Promise<Consultant | null> {
    return this.consultantModel.findByPk(id);
  }

  // 🔎 Get Consultant By User Id
  async findByUserId(userId: number): Promise<Consultant | null> {
    return this.consultantModel.findOne({ where: { user_id: userId } });
  }

  // 🧠 Update Consultant
  async update(id: number, data: Partial<Consultant>): Promise<[number, Consultant[]]> {
    return this.consultantModel.update(data, { where: { id }, returning: true });
  }

  // ❌ Delete Consultant
  async delete(id: number): Promise<number> {
    return this.consultantModel.destroy({ where: { id } });
  }
}
