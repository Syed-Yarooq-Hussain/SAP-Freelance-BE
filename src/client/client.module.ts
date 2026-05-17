import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { User } from '../../models/user.model';
import { Consultant } from '../../models/consultant.model';
import { UserRepository } from '../../repository/user.repository';
import { ProjectRepository } from '../../repository/project.repository';
import { Project } from 'models/project.model';
import { ProjectPayment } from 'models/project-payment.model';
import { ProjectPaymentRepository } from 'repository/project-payment.repository';
import { ProjectMilestone } from 'models/project-milestone.model';
import { Document } from 'models/document.model';
import { Meeting } from 'models/meeting.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';
import { MeetingRepository } from 'repository/meeting.repository';
import { ProjectConsultant } from 'models/project-consultant.model';
import { ProjectConsultantRepository } from 'repository/project-consultant.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Consultant,
      Project,
      ProjectPayment,
      ProjectMilestone,
      Document,
      Meeting,
      MeetingInvitee,
      ProjectConsultant,
    ]),
  ],
  controllers: [ClientController],
  providers: [
    ClientService,
    UserRepository,
    ProjectRepository,
    ProjectPaymentRepository,
    MeetingRepository,
    ProjectConsultantRepository,
  ],
})
export class ClientModule {}
