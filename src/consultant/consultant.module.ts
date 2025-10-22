import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Consultant } from '../../models/consultant.model';
import { ConsultantRepository } from '../../repository/consultant.repository';

@Module({
  imports: [SequelizeModule.forFeature([Consultant])],
  providers: [ConsultantRepository],
  exports: [ConsultantRepository],
})
export class ConsultantModule {}
