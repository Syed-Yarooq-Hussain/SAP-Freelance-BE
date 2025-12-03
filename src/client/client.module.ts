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

@Module({
  imports: [SequelizeModule.forFeature([User, Consultant, Project, ProjectPayment])],
  controllers: [ClientController],
  providers: [ClientService, UserRepository, ProjectRepository, ProjectPaymentRepository],
})
export class ClientModule {}
