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

  // New record create karega
  async createModule(dto: CreateConsultantModuleDto): Promise<ConsultantModule> {
    return this.consultantModuleModel.create(dto);
  }

  // Sare records fetch karega
  async findAll(): Promise<ConsultantModule[]> {
    return this.consultantModuleModel.findAll({
      include: { all: true },
    });
  }

  // Consultant ke hisab se record nikalega
  async findByConsultantId(consultantId: number): Promise<ConsultantModule[]> {
    return this.consultantModuleModel.findAll({
      where: { user_id: consultantId },
      include: { all: true },
    });
  }

  // Ek specific record find karega
  async findById(id: number): Promise<ConsultantModule | null> {
    return this.consultantModuleModel.findByPk(id, {
      include: { all: true },
    });
  }

  // Update record
  async update(id: number, data: Partial<ConsultantModule>): Promise<ConsultantModule | null> {
    const record = await this.consultantModuleModel.findByPk(id);
    if (!record) return null;
    return record.update(data);
  }

  // Delete record
  async delete(id: number): Promise<number> {
    return this.consultantModuleModel.destroy({ where: { id } });
  }
}
