import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../models/user.model';  // <-- adjust path if needed

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [ClientController],
  providers: [ClientService],
})
export class ClientModule {}
