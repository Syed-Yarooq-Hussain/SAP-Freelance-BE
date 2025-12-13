import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ModuleEntity } from '../models/module.model';

@Injectable()
export class ModuleRepository {
  constructor(
    @InjectModel(ModuleEntity)
    private readonly moduleModel: typeof ModuleEntity,
  ) {}

  // 🆕 Create Module
  async create(data: Partial<ModuleEntity>): Promise<ModuleEntity> {
    return this.moduleModel.create(data);
  }

  // 📋 Get All modules
  async findAll(isCore?: boolean): Promise<ModuleEntity[]> {
    const where: any = {};

    if (typeof isCore === 'boolean') {
      where.is_core = isCore;
    }

    return this.moduleModel.findAll({ where });
  }

  // 🔍 Get Module By Id
  async findById(id: number): Promise<ModuleEntity | null> {
    return this.moduleModel.findByPk(id);
  }

  // 🔎 Get Module By Name
  async findByName(name: string): Promise<ModuleEntity | null> {
    return this.moduleModel.findOne({ where: { name } });
  }

  // 🧠 Update Module
  async update(id: number, data: Partial<ModuleEntity>): Promise<[number, ModuleEntity[]]> {
    return this.moduleModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Module
  async delete(id: number): Promise<number> {
    return this.moduleModel.destroy({ where: { id } });
  }
}
