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
import { ConsultantModuleRepository } from 'repository/consultant-module.repository';
import { ConsultantModule  as cm} from 'models/consultant-module.model';
import { ChatRepository } from 'repository/chat.repository';
import { Chat } from 'models/chat.model';
import { ProjectTaskRepository } from 'repository/project-task.repository';
import { ProjectTask } from 'models/project-task.model';
import { CommonModule } from 'src/utility/common.module';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { ConsultantMonthlyBillRepository } from 'repository/consultant-monthly-bill.repository';
import { ProjectMilestone } from 'models/project-milestone.model';
import { ProjectMilestoneRepository } from 'repository/project-milestone.repository';

@Module({
  imports: [CommonModule, SequelizeModule.forFeature([Consultant, ProjectConsultant, User, Meeting, MeetingInvitee, cm, Chat, ProjectTask, ProjectMilestone, ConsultantMonthlyBill])],
  providers: [ConsultantRepository, ConsultantService, ProjectConsultantRepository, UserRepository, MeetingRepository, ConsultantModuleRepository, ChatRepository, ProjectTaskRepository, ProjectMilestoneRepository, ConsultantMonthlyBillRepository],
  controllers: [ConsultantController],
  exports: [ConsultantService, ConsultantRepository, ProjectConsultantRepository, UserRepository],
})
export class ConsultantModule {}
