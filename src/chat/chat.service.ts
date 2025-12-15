import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../../repository/chat.repository';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  // Send Message
  async sendMessage(payload) {
    try {
      const data = await this.chatRepository.createMessage({
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id || null,
        project_id: payload.project_id || null,
        message: payload.message,
        message_type: payload.message_type || 'text',
      });
      return { message: 'Message sent', data };
    } catch (error) {
      return { message: 'Failed to send', data: null };
    }
  }

  // Get Conversation / Messages
  async getConversation(sender_id: number, receiver_id: number) {
    const messages = await this.chatRepository.getConversation(sender_id, receiver_id);

    const formatted = messages.map((msg) => ({
      type: msg.sender_id === sender_id ? 'send' : 'receive',
      message: msg.message,
      message_type: msg.message_type,
      date_time: msg.createdAt,
      is_read: msg.is_read,
      sender_name: msg.sender.username,
      receiver_name: msg.receiver.username,
    }));
    return {message: 'Conversation fetched',data: formatted,};
  }

  // Get Latest Messages / Inbox
  async getChatList(user_id: number) {
    const list = await this.chatRepository.getChatList(user_id);

    const grouped: Record<number, any> = {};

    list.forEach((msg) => {
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
      if (msg.receiver_id === user_id && !msg.is_read) {grouped[otherUser.id].unread += 1;}
    });
    return {message: 'Inbox fetched',data: Object.values(grouped),};
  }

  // Mark Messages Read
  async markAsRead(payload: { sender_id: number; receiver_id: number }) {
    await this.chatRepository.markAsRead(payload.sender_id, payload.receiver_id);
    return { message: 'Messages marked read', data: true };
  }

  // Get Chat by Project
  async getProjectConversation(project_id: number) {
    const messages = await this.chatRepository.getProjectConversation(project_id);

    const grouped: Record<string, any> = {};

    messages.forEach((msg) => {
      const user = msg.sender;

      if (!grouped[user.username]) {
        grouped[user.username] = {
          User_name: user.username,
          Messages: [],
        };
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
    return {message: 'Project conversation fetched successfully',data: Object.values(grouped),};
  }

  // Delete Message
  async deleteMessage(id: number) {
    await this.chatRepository.deleteMessage(id);
    return { message: 'Message deleted', data: true };
  }
}
