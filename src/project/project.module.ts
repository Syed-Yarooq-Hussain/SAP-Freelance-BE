import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

// ✅ Models import
import { Project } from '../../models/project.model';
import { ProjectConsultant } from '../../models/project-consultant.model';
import { ProjectIndustry } from '../../models/project-industries.model';
import { ProjectMilestone } from '../../models/project-milestone.model';
import { ProjectPayment } from '../../models/project-payment.model';
import { ProjectTask } from '../../models/project-task.model';


// ✅ Repositories import
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ProjectIndustriesRepository } from '../../repository/project-indestries.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectPaymentRepository } from '../../repository/project-payment.repository';
import { ProjectTaskRepository } from '../../repository/project-task.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Project,
      ProjectConsultant,
      ProjectIndustry,
      ProjectMilestone,
      ProjectPayment,
      ProjectTask,
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
  ],
  exports: [
    ProjectRepository,
    ProjectConsultantRepository,
    ProjectIndustriesRepository,
    ProjectMilestoneRepository,
    ProjectPaymentRepository,
    ProjectTaskRepository,
  ],
})
export class ProjectModule {}
