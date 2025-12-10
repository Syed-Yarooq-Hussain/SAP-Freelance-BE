import { Controller, Post, Get, Body, Query, Patch, Delete, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto, MarkReadDto, DeleteMessageDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Send Message
  @Post('send')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  // Get Conversation / Messages
  @Get('conversation')
  async getConversation(
    @Query('sender_id') sender_id: number,
    @Query('receiver_id') receiver_id: number,
  ) {
    return this.chatService.getConversation(Number(sender_id), Number(receiver_id));
  }

  // Get Latest Messages / Inbox
  @Get('inbox')
  getChatList(@Query('user_id') user_id: number) {
    return this.chatService.getChatList(Number(user_id));
  }

  // Mark Messages Read
  @Patch('mark-read')
  markAsRead(@Body() dto: MarkReadDto) {
    return this.chatService.markAsRead(dto);
  }

  // Get Chat by Project
  @Get('project/:project_id')
  getProjectConversation(@Param('project_id') project_id: number,) {
    return this.chatService.getProjectConversation(Number(project_id));
  }

  // Delete Message
  @Delete('delete')
  deleteMessage(@Body() dto: DeleteMessageDto) {
    return this.chatService.deleteMessage(dto.id);
  }
}
