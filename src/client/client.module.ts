import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { User } from '../../models/user.model';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
