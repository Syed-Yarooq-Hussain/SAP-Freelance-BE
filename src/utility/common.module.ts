import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { Meeting } from 'models/meeting.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';
import { MeetingRepository } from 'repository/meeting.repository';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { ProjectConsultant } from 'models/project-consultant.model';
import { ModuleEntity } from 'models/module.model';
import { ModuleRepository } from 'repository/module.repository';


@Module({
  imports: [SequelizeModule.forFeature([Meeting, MeetingInvitee, ProjectConsultant, ModuleEntity])],
  controllers: [CommonController],
  providers: [CommonService, MeetingRepository, ProjectConsultantRepository, ModuleRepository],
})
export class CommonModule {}
