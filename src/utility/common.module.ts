import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { Meeting } from 'models/meeting.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';
import { MeetingRepository } from 'repository/meeting.repository';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';
import { ProjectConsultant } from 'models/project-consultant.model';
import { EmailService } from 'src/common/emails/email.service';


@Module({
  imports: [SequelizeModule.forFeature([Meeting, MeetingInvitee, ProjectConsultant])],
  controllers: [CommonController],
  providers: [CommonService, MeetingRepository, ProjectConsultantRepository, EmailService],
})
export class CommonModule {}
