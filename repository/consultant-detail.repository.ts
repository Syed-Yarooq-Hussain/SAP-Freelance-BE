import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConsultantDetail } from '../models/consultant-detail.model';
import { CreateConsultantDetailDto } from '../src/user/dto/create-consultant-detail.dto';

@Injectable()
export class ConsultantDetailRepository {
  constructor(
    @InjectModel(ConsultantDetail)
    private readonly consultantModel: typeof ConsultantDetail,
  ) {}

  async createDetail(dto: CreateConsultantDetailDto, userId: number): Promise<ConsultantDetail> {
    return this.consultantModel.create({ ...dto, user_id: userId });
  }

  async findByUserId(userId: number): Promise<ConsultantDetail | null> {
    return this.consultantModel.findOne({ where: { user_id: userId } });
  }
}
