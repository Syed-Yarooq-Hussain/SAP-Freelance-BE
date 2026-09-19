import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'models/user.model';
import { UserRepository } from 'repository/user.repository';
import { ProjectRepository } from 'repository/project.repository';
import { Project } from 'models/project.model';
import { Industries } from 'models/industries.model';
import { IndustriesRepository } from 'repository/indutries.repository';
import { ProjectPayment } from 'models/project-payment.model';
import { ProjectPaymentRepository } from 'repository/project-payment.repository';
import { ProjectMilestone } from 'models/project-milestone.model';
import { ProjectTask } from 'models/project-task.model';
import { Document } from 'models/document.model';
import { ConsultantMonthlyBill } from 'models/consultant-monthly-bill.model';
import { ConsultantMonthlyBillRepository } from 'repository/consultant-monthly-bill.repository';
import { Meeting } from 'models/meeting.model';
import { Consultant } from 'models/consultant.model';
import { ConsultantModule } from 'models/consultant-module.model';
import { ModuleEntity } from 'models/module.model';
import { ModuleRequest } from 'models/module-request.model';
import { RolesGuard } from 'src/auth/roles.guard';
import { EmailDispatch } from 'models/email-dispatch.model';
import { ConsultantModule as ConsultantFeatureModule } from 'src/consultant/consultant.module';

@Module({
  imports: [ConsultantFeatureModule, SequelizeModule.forFeature([User, Consultant, ConsultantModule, ModuleEntity, ModuleRequest, EmailDispatch, Project, Industries, ProjectPayment, ProjectMilestone, Document, ConsultantMonthlyBill, Meeting])],
  controllers: [AdminController],
  providers: [AdminService, UserRepository, ProjectRepository, IndustriesRepository, ProjectPaymentRepository, ConsultantMonthlyBillRepository, RolesGuard],
  exports: [AdminService],
})
export class AdminModule {}
