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
  async createMessage(payload: {
    sender_id: number;
    receiver_id?: number;
    project_id?: number;
    message: string;
    message_type: string;
  }) {
    return this.chatModel.create(payload);
  }

  // Get conversation by id
async getConversation(sender_id: number, receiver_id: number) {
  const messages = await this.chatModel.findAll({
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

  const formatted = messages.map(msg => ({
    type: msg.sender_id === sender_id ? 'send' : 'receive',
    message: msg.message,
    message_type: msg.message_type,
    date_time: msg.createdAt,
    is_read: msg.is_read,
    sender_name: msg.sender.username,
    receiver_name: msg.receiver.username,
  }));
  return formatted;
}

  // Get inbox/latest messages
  async getChatList(user_id: number) {
    const chats = await this.chatModel.findAll({
      where: { [Op.or]: [{ sender_id: user_id }, { receiver_id: user_id }], deleted_at: null },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'username'] },
        { model: User, as: 'receiver', attributes: ['id', 'username'] },
      ],
      order: [['created_at', 'DESC']],
    });

    const grouped: Record<number, any> = {};

    chats.forEach(msg => {
      const otherUser = msg.sender_id === user_id ? msg.receiver : msg.sender;
      if (!otherUser) return;

      if (!grouped[otherUser.id]) {
        grouped[otherUser.id] = {
          user_id: otherUser.id,
          username: otherUser.username,
          last_message: msg.message,
          last_message_type: msg.sender_id === user_id ? 'send' : 'receive',
          last_message_time: msg.createdAt,
          unread: 0,
        };
      }

      if (msg.receiver_id === user_id && !msg.is_read) grouped[otherUser.id].unread += 1;
    });

    return Object.values(grouped);
  }

  // Mark messages as read
  async markAsRead(sender_id: number, receiver_id: number) {
    await this.chatModel.update(
      { is_read: true },
      { where: { sender_id, receiver_id, is_read: false, deleted_at: null } },
    );
    return true;
  }

  // Get chat by project
async getProjectConversation(project_id: number) {
  const messages = await this.chatModel.findAll({
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

  const grouped: Record<string, any> = {};

  messages.forEach(msg => {
    const user = msg.sender;

    if (!grouped[user.username]) {
      grouped[user.username] = { User_name: user.username, Messages: [] };
    }

    grouped[user.username].Messages.push({
      type: 'send',
      message: msg.message,
      message_type: msg.message_type,
      date_time: msg.createdAt,
      is_read: msg.is_read,
      sender_name: msg.sender.username,
      receiver_name: msg.receiver?.username || null,
    });
  });
  return Object.values(grouped);
}

  // Soft delete a message
  async deleteMessage(id: number) {
    await this.chatModel.update({ deleted_at: new Date() }, { where: { id } });
    return true;
  }
}
