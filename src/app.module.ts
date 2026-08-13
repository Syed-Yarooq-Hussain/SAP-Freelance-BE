import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
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
import { CommonModule } from './utility/common.module';
import { Meeting } from 'models/meeting.model';
import { MeetingInvitee } from 'models/meeting-invitee.model';
import { AdminModule } from './admin/admin.module';
import { ChatModule } from './chat/chat.module';
import * as pgConnectionString from 'pg-connection-string';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { ModuleRequest } from 'models/module-request.model';
import { EmailDispatch } from 'models/email-dispatch.model';
import { ProjectDocument } from 'models/project-document.model';

let config:any = null
if (process.env.NODE_ENV === 'production') {
  config = pgConnectionString.parse(process.env.DATABASE_URL);
}
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.NODE_ENV == 'production' ? config.host : process.env.DB_HOST,
      port: process.env.NODE_ENV == 'production' ? Number(config.port) : Number(process.env.DB_PORT),
      username: process.env.NODE_ENV == 'production' ? config.user : process.env.DB_USER,
      password: process.env.NODE_ENV == 'production' ? config.password : process.env.DB_PASSWORD,
      database: process.env.NODE_ENV == 'production' ? config.database : process.env.DB_NAME,
      autoLoadModels: true,
      synchronize: false,
      dialectOptions: process.env.NODE_ENV == 'production' ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      } : undefined,
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
        Meeting,
        MeetingInvitee,
        ConsultantMonthlyBill,
        ProjectDocument,
        ModuleRequest,
        EmailDispatch,
      ],
    }),
    CommonModule,
    PassportModule,
    UserModule,
    AuthModule,
    ProjectModule,
    ClientModule,
    ConsultantModule,
    AdminModule,
    ChatModule,
  ],
})
export class AppModule {}
