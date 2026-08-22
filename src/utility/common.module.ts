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
import { Consultant } from 'models/consultant.model';
import { ConsultantRepository } from 'repository/consultant.repository';
import { Industries } from 'models/industries.model';
import { IndustriesRepository } from 'repository/indutries.repository';
import { User } from 'models/user.model';
import { UserRepository } from 'repository/user.repository';
import { DocumentRepository } from 'repository/document.repository';
import { Document } from 'models/document.model';
import { ModuleRequest } from 'models/module-request.model';
import { RolesGuard } from 'src/auth/roles.guard';
import { ConsultantModule } from 'models/consultant-module.model';


@Module({
  imports: [SequelizeModule.forFeature([Meeting, MeetingInvitee, ProjectConsultant, ModuleEntity, Consultant, ConsultantModule, Industries, User, Document, ModuleRequest])],
  controllers: [CommonController],
  providers: [CommonService, MeetingRepository, ProjectConsultantRepository, ModuleRepository, ConsultantRepository, IndustriesRepository, UserRepository, DocumentRepository, RolesGuard],
  exports: [CommonService],
})
export class CommonModule {}
