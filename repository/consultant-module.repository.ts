import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConsultantModule } from '../models/consultant-module.model';
import { CreateConsultantModuleDto } from '../src/user/dto/create-consultant-module.dto';

@Injectable()
export class ConsultantModuleRepository {
  constructor(
    @InjectModel(ConsultantModule)
    private readonly consultantModuleModel: typeof ConsultantModule,
  ) {}

  // 🟢 Create New Record
  async createModule(dto: any): Promise<ConsultantModule> {
    return this.consultantModuleModel.create(dto);
  }

  // 📋 Get All Records
  async findAll(): Promise<ConsultantModule[]> {
    return this.consultantModuleModel.findAll({
      include: { all: true },
    });
  }

  // 🔍 Records Will Be Fetched By Consultant
  async findByConsultantId(consultantId: number): Promise<ConsultantModule[]> {
    return this.consultantModuleModel.findAll({
      where: { user_id: consultantId },
      include: { all: true },
    });
  }

  // 🔎 Get Specific Record
  async findById(id: number): Promise<ConsultantModule | null> {
    return this.consultantModuleModel.findByPk(id, {
      include: { all: true },
    });
  }

  // 🧠 Update Record
  async update(id: number, data: Partial<ConsultantModule>): Promise<ConsultantModule | null> {
    const record = await this.consultantModuleModel.findByPk(id);
    if (!record) return null;
    return record.update(data);
  }

  // ❌ Delete Record
  async delete(id: number): Promise<number> {
    return this.consultantModuleModel.destroy({ where: { id } });
  }

  // update consultant module 
  async updateModule(params: {
    user_id: number;
    module_id: number;
    is_primary?: boolean;
  }) {
    const { user_id, module_id, is_primary = false } = params;

    // ✅ Step 1: Check if module already exists for user
    const existing = await ConsultantModule.findOne({
      where: { user_id, module_id },
    });

    if (existing) {
      // ✅ Module exists → update is_primary if needed
      if (existing.is_primary !== is_primary) {
        existing.is_primary = is_primary;
        await existing.save();
      }
      return existing;
    }

    // ✅ Step 2: Module does not exist → create new
    const newModule = await ConsultantModule.create({
      user_id,
      module_id,
      is_primary,
    });

    return newModule;
  }

}
