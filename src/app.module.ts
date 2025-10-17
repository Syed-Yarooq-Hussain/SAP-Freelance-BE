import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';

import { User } from '../models/user.model';
import { ConsultantDetail } from 'models/consultant-detail.model';
import { Project } from 'models/project.model';
import { ConsultantInterview } from 'models/consultant-interview.model';
import { ProjectResponsibilityMatrix } from 'models/project-responsibility-matrix.model';
import { ProjectMilestone } from 'models/project-milestone.model';
import { ProjectScopeOfWork } from 'models/project-scope-of-work.model';
import { ProjectSummary } from 'models/project-summary.model';
import { ProjectConsultant } from 'models/project-consultant.model';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';

import { ClientModule } from './client/client.module';
import { ConsultantModule } from './consultant/consultant.module';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin',
      database: 'sap_freelancer_portal',
      autoLoadModels: true,
      synchronize: false,
      models: [
        User,
        ConsultantDetail,
        Project,
        ProjectConsultant,
        ConsultantInterview,
        ProjectSummary,
        ProjectScopeOfWork,
        ProjectMilestone,
        ProjectResponsibilityMatrix,
      ],
    }),
    PassportModule,
    UserModule,
    AuthModule,
    ProjectModule,
    ClientModule,      
    ConsultantModule,
  ],
})
export class AppModule {}
