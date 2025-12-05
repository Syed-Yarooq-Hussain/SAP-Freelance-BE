import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Chat } from '../../models/chat.model';
import { User } from '../../models/user.model';
import { ChatRepository } from '../../repository/chat.repository';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [SequelizeModule.forFeature([Chat, User])],
  providers: [ChatRepository, ChatService],
  controllers: [ChatController],
  exports: [ChatRepository],
})
export class ChatModule {}
