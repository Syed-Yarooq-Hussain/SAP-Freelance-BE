import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Chat } from '../models/chat.model';
import { User } from '../models/user.model';
import { Op } from 'sequelize';

@Injectable()
export class ChatRepository {
  constructor(
    @InjectModel(Chat) private chatModel: typeof Chat,
    @InjectModel(User) private userModel: typeof User,
  ) {}

  // Create a new message
  createMessage(payload) {
    return this.chatModel.create(payload);
  }

  // Get conversation by id
  getConversation(sender_id: number, receiver_id: number) {
    return this.chatModel.findAll({
      where: {
        [Op.or]: [
          { sender_id, receiver_id },
          { sender_id: receiver_id, receiver_id: sender_id },
        ],
        deleted_at: null,
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'ASC']],
    });
  }
  
  // Get inbox/latest messages
  getChatList(user_id: number) {
    return this.chatModel.findAll({
      where: {
        [Op.or]: [{ sender_id: user_id }, { receiver_id: user_id }],
        deleted_at: null,
      },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

    // Mark messages as read
  markAsRead(sender_id: number, receiver_id: number) {
    return this.chatModel.update(
      { is_read: true },
      { where: { sender_id, receiver_id, is_read: false, deleted_at: null } },
    );
  }
    // Get chat by project
  getProjectConversation(project_id: number) {
    return this.chatModel.findAll({
      where: { 
        project_id,
        deleted_at: null,
       },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'ASC']],
    });
  }

    // Soft delete a message
  deleteMessage(id: number) {
    return this.chatModel.update({ deleted_at: new Date() }, { where: { id } });
  }
}
