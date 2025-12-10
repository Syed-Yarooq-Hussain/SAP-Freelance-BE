import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from 'models/user.model';
import { UserRepository } from 'repository/user.repository';
import { ProjectRepository } from 'repository/project.repository';
import { Project } from 'models/project.model';

@Module({
  imports: [SequelizeModule.forFeature([User, Project])],
  controllers: [AdminController],
  providers: [AdminService, UserRepository, ProjectRepository],
  exports: [AdminService],
})
export class AdminModule {}
