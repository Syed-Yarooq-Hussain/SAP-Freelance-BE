import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Consultant } from '../models/consultant.model';
import { User } from 'models/user.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';

@Injectable()
export class ConsultantRepository {
  constructor(
    @InjectModel(Consultant)
    private readonly consultantModel: typeof Consultant,
  ) {}

  // 🟢 Create Consultant Detail
async createDetail(dto: any) {
  return this.consultantModel.create(dto);
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
    return this.consultantModel.findOne({ where: { user_id: userId },
      attributes: ['rate', 'experience', 'weekly_available_hours', 'level'],
      include: [{
        model: User,
        attributes: ['id', 'username', 'email', 'city', 'country'],
        include: [{
          model: ConsultantModule,
          attributes: ['id', 'is_primary'],
          include: [{
            model: ModuleEntity,
            attributes: ['id', 'name'],
          }]
        }]
      },
    ]
    });
  }
  
  // 🔎 Get Consultant By User Id
  async findConsultantProfileByUserId(userId: number): Promise<Consultant | null> {
    return this.consultantModel.findOne({ where: { user_id: userId },
      include: [{
        model: User,
        attributes: ['id', 'username', 'email', 'city', 'country', 'phone', 'avatar', 'linkedin_url'],
        include: [{
          model: ConsultantModule,
          attributes: ['id', 'is_primary'],
          include: [{
            model: ModuleEntity,
            attributes: ['id', 'name'],
          }]
        }]
      },
    ]
    });
  }

  async getSchedulesByUserId(id: number): Promise<Consultant | null> 
  {
    return this.consultantModel.findOne({ where: { user_id: id },
      attributes: ['working_schedule'],
    });
  }


  // 🧠 Update Consultant
  async updateByUserId(id: number, data: Partial<Consultant>): Promise<[number, Consultant[]]> {
    return this.consultantModel.update(data, { where: { user_id: id }, returning: true });
  }

  // ❌ Delete Consultant
  async delete(id: number): Promise<number> {
    return this.consultantModel.destroy({ where: { id } });
  }

  // ❌ Delete Consultant By User Id
  async deleteByUserId(userId: number): Promise<number> {
    return this.consultantModel.destroy({ where: { user_id: userId } });
  }
}
