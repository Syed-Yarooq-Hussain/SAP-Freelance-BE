import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../../repository/chat.repository';

@Injectable()
export class ChatService {
  constructor(private readonly chatRepository: ChatRepository) {}

  // Send Message
  async sendMessage(payload: { sender_id: number; receiver_id?: number; project_id?: number; message: string; message_type?: string }) {
    try {
      const data = await this.chatRepository.createMessage({
        sender_id: payload.sender_id,
        receiver_id: payload.receiver_id || null,
        project_id: payload.project_id || null,
        message: payload.message,
        message_type: payload.message_type || 'text',
      });
      return { code: 200, status: 'success', message: 'Message sent', data };
    } catch (error) {
      return { code: 500, status: 'error', message: 'Failed to send', data: null };
    }
  }

  // Get Conversation / Messages
  async getConversation(sender_id: number, receiver_id: number) {
    const messages = await this.chatRepository.getConversation(sender_id, receiver_id);
    return { code: 200, status: 'success', message: 'Conversation fetched', data: messages,};
  }

  // Get Latest Messages / Inbox
  async getChatList(user_id: number) {
    const list = await this.chatRepository.getChatList(user_id);
    return { code: 200, status: 'success', message: 'Inbox fetched', data: list };
  }

  // Mark Messages Read
  async markAsRead(payload: { sender_id: number; receiver_id: number }) {
    await this.chatRepository.markAsRead(payload.sender_id, payload.receiver_id);
    return { code: 200, status: 'success', message: 'Messages marked read', data: true };
  }

  // Get Chat by Project
  async getProjectConversation(project_id: number, limit?: number, page?: number) {
  const messages = await this.chatRepository.getProjectConversation(project_id);
    return {code: 200,status: 'success',message: 'Project conversation fetched successfully',data: messages,};
  }

  // Delete Message
  async deleteMessage(id: number) {
    await this.chatRepository.deleteMessage(id);
    return { code: 200, status: 'success', message: 'Message deleted', data: true };
  }
}
