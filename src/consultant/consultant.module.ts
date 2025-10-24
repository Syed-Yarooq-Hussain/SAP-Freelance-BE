import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Consultant } from '../../models/consultant.model';
import { ConsultantRepository } from '../../repository/consultant.repository';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';

@Module({
  imports: [SequelizeModule.forFeature([Consultant])],
  providers: [ConsultantRepository,ConsultantService,],
  controllers: [ConsultantController],
  exports: [ConsultantRepository],
})
export class ConsultantModule {}
