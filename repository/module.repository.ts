import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ModuleEntity } from '../models/module.model';

@Injectable()
export class ModuleRepository {
  constructor(
    @InjectModel(ModuleEntity)
    private readonly moduleModel: typeof ModuleEntity,
  ) {}

  // 🆕 Naya module create karne ke liye
  async create(data: Partial<ModuleEntity>): Promise<ModuleEntity> {
    return this.moduleModel.create(data);
  }

  // 📋 Sab modules get karne ke liye
  async findAll(): Promise<ModuleEntity[]> {
    return this.moduleModel.findAll();
  }

  // 🔍 Module ko ID se find karne ke liye
  async findById(id: number): Promise<ModuleEntity | null> {
    return this.moduleModel.findByPk(id);
  }

  // 🔎 Module ko name se find karne ke liye (agar name field exist karta hai)
  async findByName(name: string): Promise<ModuleEntity | null> {
    return this.moduleModel.findOne({ where: { name } });
  }

  // 🧠 Module update karne ke liye
  async update(id: number, data: Partial<ModuleEntity>): Promise<[number, ModuleEntity[]]> {
    return this.moduleModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Module delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.moduleModel.destroy({ where: { id } });
  }
}
