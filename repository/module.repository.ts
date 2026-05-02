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

  // 📋 Get All modules (flat)
  async findAll(isCore?: boolean): Promise<ModuleEntity[]> {
    const where: any = {
      deleted_at: null,
    };

    if (typeof isCore === 'boolean') {
      where.is_core = isCore;
    }

    return this.moduleModel.findAll({ where });
  }

  // 🌳 Get Root Modules (parent_id = null)
  async findRoots(): Promise<ModuleEntity[]> {
    return this.moduleModel.findAll({
      where: {
        parent_id: null,
        deleted_at: null,
      },
    });
  }

  // 🌿 Get Children by parent
  async findChildren(parentId: number): Promise<ModuleEntity[]> {
    return this.moduleModel.findAll({
      where: {
        parent_id: parentId,
        deleted_at: null,
      },
    });
  }

  // 🌲 Recursive Tree Fetch (MAIN FUNCTION 🔥)
  async getTree(): Promise<any[]> {
    const categories = await this.moduleModel.findAll({
      where: { is_core: true, deleted_at: null },
      attributes: ['id', 'name'],
      include: [
        {
          model: ModuleEntity,
          as: 'children',
          where: { deleted_at: null },
          required: false,
          attributes: ['id', 'name'],
        },
      ],
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      modules: cat.children ?? [],
    }));
  }

  // 🔍 Get Module By Id
  async findById(id: number): Promise<ModuleEntity | null> {
    return this.moduleModel.findOne({
      where: { id, deleted_at: null },
    });
  }

  // 🔎 Get Module By Name
  async findByName(name: string): Promise<ModuleEntity | null> {
    return this.moduleModel.findOne({
      where: { name, deleted_at: null },
    });
  }

  // 🧠 Update Module
  async update(
    id: number,
    data: Partial<ModuleEntity>,
  ): Promise<[number, ModuleEntity[]]> {
    return this.moduleModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Soft Delete (IMPORTANT CHANGE 🔥)
  async delete(id: number): Promise<number> {
    return this.moduleModel.update(
      { deleted_at: new Date() },
      { where: { id } },
    ).then(([affected]) => affected);
  }
}