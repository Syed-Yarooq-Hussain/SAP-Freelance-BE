import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { Meeting } from 'models/meeting.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';
import { MeetingRepository } from 'repository/meeting.repository';
import { UserRepository } from 'repository/user.repository';


@Module({
  imports: [SequelizeModule.forFeature([Meeting, MeetingInvitee])],
  controllers: [CommonController],
  providers: [CommonService, MeetingRepository, UserRepository],
})
export class CommonModule {}
