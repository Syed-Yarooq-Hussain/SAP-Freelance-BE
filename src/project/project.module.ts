import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

// Models
import { Project } from '../../models/project.model';
import { ProjectConsultant } from '../../models/project-consultant.model';
import { ConsultantInterview } from '../../models/consultant-interview.model';
import { ProjectSummary } from '../../models/project-summary.model';
import { ProjectScopeOfWork } from '../../models/project-scope-of-work.model';
import { ProjectMilestone } from '../../models/project-milestone.model';
import { ProjectResponsibilityMatrix } from '../../models/project-responsibility-matrix.model';

// Repositories
import { ProjectRepository } from '../../repository/project.repository';
import { ProjectConsultantRepository } from '../../repository/project-consultant.repository';
import { ConsultantInterviewRepository } from '../../repository/consultant-interview.repository';
import { ProjectSummaryRepository } from '../../repository/project-summary.repository';
import { ProjectScopeOfWorkRepository } from '../../repository/project-scope-of-work.repository';
import { ProjectMilestoneRepository } from '../../repository/project-milestone.repository';
import { ProjectResponsibilityMatrixRepository } from '../../repository/project-responsibility-matrix.repository';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Project,
      ProjectConsultant,
      ConsultantInterview,
      ProjectSummary,
      ProjectScopeOfWork,
      ProjectMilestone,
      ProjectResponsibilityMatrix,
    ]),
  ],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectRepository,
    ProjectConsultantRepository,
    ConsultantInterviewRepository,
    ProjectSummaryRepository,
    ProjectScopeOfWorkRepository,
    ProjectMilestoneRepository,
    ProjectResponsibilityMatrixRepository,
  ],
})
export class ProjectModule {}
