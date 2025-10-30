import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { User } from '../../models/user.model';
import { Consultant } from '../../models/consultant.model';
import { UserRepository } from '../../repository/user.repository';

@Module({
  imports: [SequelizeModule.forFeature([User, Consultant])],
  controllers: [ClientController],
  providers: [ClientService, UserRepository],
})
export class ClientModule {}
