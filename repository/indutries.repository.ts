import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Industries } from '../models/industries.model';

@Injectable()
export class IndustriesRepository {
  constructor(
    @InjectModel(Industries)
    private readonly industryModel: typeof Industries,
  ) {}

  // 🏭 Nayi industry create karne ke liye
  async create(data: Partial<Industries>): Promise<Industries> {
    return this.industryModel.create(data);
  }

  // 📋 Sab industries get karne ke liye
  async findAll(): Promise<Industries[]> {
    return this.industryModel.findAll();
  }

  // 🔍 Kisi industry ko ID se find karne ke liye
  async findById(id: number): Promise<Industries | null> {
    return this.industryModel.findByPk(id);
  }

  // 🔎 Industry ko name se find karne ke liye (agar field exist karti hai)
  async findByName(name: string): Promise<Industries | null> {
    return this.industryModel.findOne({ where: { name } });
  }

  // 🧠 Industry update karne ke liye
  async update(id: number, data: Partial<Industries>): Promise<[number, Industries[]]> {
    return this.industryModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Industry delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.industryModel.destroy({ where: { id } });
  }
}
