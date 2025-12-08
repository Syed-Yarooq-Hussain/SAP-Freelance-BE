import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Consultant } from '../../models/consultant.model';
import { ConsultantRepository } from '../../repository/consultant.repository';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { ProjectConsultant } from 'models/project-consultant.model';

@Module({
  imports: [SequelizeModule.forFeature([Consultant, ProjectConsultant])],
  providers: [ConsultantRepository,ConsultantService,ProjectConsultantRepository],
  controllers: [ConsultantController],
  exports: [ConsultantRepository,ProjectConsultantRepository],
})
export class ConsultantModule {}
