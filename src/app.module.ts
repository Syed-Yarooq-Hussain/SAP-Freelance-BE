import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { ModuleEntity } from '../models/module.model';
import { Consultant } from '../models/consultant.model';
import { ConsultantModule as ConsultantModuleModel } from '../models/consultant-module.model';
import { Industries } from '../models/industries.model';
import { Project } from '../models/project.model';
import { ProjectIndustry } from '../models/project-industries.model';
import { ProjectConsultant } from '../models/project-consultant.model';
import { ProjectDetail } from '../models/project-detail.model';
import { ProjectMilestone } from '../models/project-milestone.model';
import { ProjectTask } from '../models/project-task.model';
import { Document } from '../models/document.model';
import { MilestoneDocs } from '../models/milestone-docs.model';
import { ProjectPayment } from '../models/project-payment.model';
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
        ModuleEntity,
        Consultant,
        ConsultantModuleModel,
        Industries,
        Project,
        ProjectIndustry,
        ProjectConsultant,
        ProjectDetail,
        ProjectMilestone,
        ProjectTask,
        Document,
        MilestoneDocs,
        ProjectPayment,
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
