import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

// ✅ Models Import
import { Project } from '../../models/project.model';
import { ProjectConsultant } from '../../models/project-consultant.model';
import { ProjectIndustry } from '../../models/project-industries.model';
import { ProjectMilestone } from '../../models/project-milestone.model';
import { ProjectPayment } from '../../models/project-payment.model';
import { ProjectTask } from '../../models/project-task.model';
import { ProjectDocument } from '../../models/project-document.model';


// ✅ Repositories Import
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ProjectIndustriesRepository } from '../../repository/project-indestries.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectPaymentRepository } from '../../repository/project-payment.repository';
import { ProjectTaskRepository } from '../../repository/project-task.repository';
import { User } from 'models/user.model';
import { UserRepository } from 'repository/user.repository';
import { ProjectDetail } from 'models/project-detail.model';
import { ProjectDetailRepository } from 'repository/project-detail.repository';
import { Consultant } from 'models/consultant.model';
import { ConsultantRepository } from 'repository/consultant.repository';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { ConsultantMonthlyBillRepository } from 'repository/consultant-monthly-bill.repository';
import { ProjectDocumentRepository } from 'repository/project-document.repository';
import { CommonModule } from 'src/utility/common.module';

@Module({
  imports: [
    CommonModule,
    SequelizeModule.forFeature([
      Project,
      ProjectConsultant,
      ProjectIndustry,
      ProjectMilestone,
      ProjectPayment,
      ProjectTask,
      ProjectDetail,
      User,
      Consultant,
      ConsultantMonthlyBill,
      ProjectDocument
    ]),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectRepository,
    ProjectConsultantRepository,
    ProjectIndustriesRepository,
    ProjectMilestoneRepository,
    ProjectPaymentRepository,
    ProjectTaskRepository,
    ProjectDetailRepository,
    UserRepository,
    ConsultantRepository,
    ConsultantMonthlyBillRepository,
    ProjectDocumentRepository
  ],
  exports: [
    ProjectRepository,
    ProjectConsultantRepository,
    ProjectIndustriesRepository,
    ProjectMilestoneRepository,
    ProjectPaymentRepository,
    ProjectTaskRepository,
    ProjectDetailRepository,
    UserRepository,
    ConsultantRepository,
    ProjectDocumentRepository
  ],
})
export class ProjectModule {}
