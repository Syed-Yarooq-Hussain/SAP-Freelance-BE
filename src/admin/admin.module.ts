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

@Module({
  imports: [SequelizeModule.forFeature([User, Project, Industries])],
  controllers: [AdminController],
  providers: [AdminService, UserRepository, ProjectRepository, IndustriesRepository],
  exports: [AdminService],
})
export class AdminModule {}
