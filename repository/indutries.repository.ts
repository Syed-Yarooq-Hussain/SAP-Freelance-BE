import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Industries } from '../models/industries.model';

@Injectable()
export class IndustriesRepository {
  constructor(
    @InjectModel(Industries)
    private readonly industryModel: typeof Industries,
  ) {}

  // 🏭 Create Industry
  async create(data: Partial<Industries>): Promise<Industries> {
    return this.industryModel.create(data);
  }

  // 📋 Get All Industries
  async findAll(): Promise<Industries[]> {
    return this.industryModel.findAll();
  }

  // 🔍 Get Industry By Id
  async findById(id: number): Promise<Industries | null> {
    return this.industryModel.findByPk(id);
  }

  // 🔎 Get Industry By Name
  async findByName(name: string): Promise<Industries | null> {
    return this.industryModel.findOne({ where: { name } });
  }

  // 🧠 Update Industry
  async update(id: number, data: Partial<Industries>): Promise<[number, Industries[]]> {
    return this.industryModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Industry
  async delete(id: number): Promise<number> {
    return this.industryModel.destroy({ where: { id } });
  }
}
