import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Consultant } from '../../models/consultant.model';
import { ConsultantRepository } from '../../repository/consultant.repository';
import { ConsultantController } from './consultant.controller';
import { ConsultantService } from './consultant.service';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { ProjectConsultant } from 'models/project-consultant.model';
import { User } from 'models/user.model';
import { UserRepository } from 'repository/user.repository';
import { MeetingRepository } from 'repository/meeting.repository';
import { Meeting } from 'models/meeting.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';

@Module({
  imports: [SequelizeModule.forFeature([Consultant, ProjectConsultant, User, Meeting, MeetingInvitee])],
  providers: [ConsultantRepository, ConsultantService, ProjectConsultantRepository, UserRepository, MeetingRepository],
  controllers: [ConsultantController],
  exports: [ConsultantRepository, ProjectConsultantRepository, UserRepository],
})
export class ConsultantModule {}
