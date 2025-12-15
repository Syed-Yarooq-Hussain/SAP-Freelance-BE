import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { MilestoneDocs } from '../models/milestone-docs.model';

@Injectable()
export class MilestoneDocsRepository {
  constructor(
    @InjectModel(MilestoneDocs)
    private readonly milestoneDocModel: typeof MilestoneDocs,
  ) {}

  // 🆕 Create Milestone Document
  async create(data: Partial<MilestoneDocs>): Promise<MilestoneDocs> {
    return this.milestoneDocModel.create(data);
  }

  // 📋 Get All Milestone Documents
  async findAll(): Promise<MilestoneDocs[]> {
    return this.milestoneDocModel.findAll();
  }

  // 🔍 Get Document By Id
  async findById(id: number): Promise<MilestoneDocs | null> {
    return this.milestoneDocModel.findByPk(id);
  }

  // 🔎 Get Milestone Documents By Id 
  async findByMilestoneId(milestoneId: number): Promise<MilestoneDocs[]> {
    return this.milestoneDocModel.findAll({ where: { milestone_id: milestoneId } });
  }

  // 🧠 Uptade Milestone Document 
  async update(id: number, data: Partial<MilestoneDocs>): Promise<[number, MilestoneDocs[]]> {
    return this.milestoneDocModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Milestone Document 
  async delete(id: number): Promise<number> {
    return this.milestoneDocModel.destroy({ where: { id } });
  }
}
