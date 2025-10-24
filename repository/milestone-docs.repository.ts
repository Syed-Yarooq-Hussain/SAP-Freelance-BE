import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MilestoneDocs } from '../models/milestone-docs.model';

@Injectable()
export class MilestoneDocsRepository {
  constructor(
    @InjectModel(MilestoneDocs)
    private readonly milestoneDocModel: typeof MilestoneDocs,
  ) {}

  // 🆕 Naya milestone document create karne ke liye
  async create(data: Partial<MilestoneDocs>): Promise<MilestoneDocs> {
    return this.milestoneDocModel.create(data);
  }

  // 📋 Sab milestone documents get karne ke liye
  async findAll(): Promise<MilestoneDocs[]> {
    return this.milestoneDocModel.findAll();
  }

  // 🔍 Kisi document ko ID se find karne ke liye
  async findById(id: number): Promise<MilestoneDocs | null> {
    return this.milestoneDocModel.findByPk(id);
  }

  // 🔎 Milestone ke documents get karne ke liye (agar milestone_id foreign key hai)
  async findByMilestoneId(milestoneId: number): Promise<MilestoneDocs[]> {
    return this.milestoneDocModel.findAll({ where: { milestone_id: milestoneId } });
  }

  // 🧠 Milestone document update karne ke liye
  async update(id: number, data: Partial<MilestoneDocs>): Promise<[number, MilestoneDocs[]]> {
    return this.milestoneDocModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Milestone document delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.milestoneDocModel.destroy({ where: { id } });
  }
}
