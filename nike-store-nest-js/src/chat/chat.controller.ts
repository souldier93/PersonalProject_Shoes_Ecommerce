import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  createOrGetConversation(@Body() body: any) {
    return this.chatService.createOrGetConversation(body);
  }

  @Get('conversations')
  listConversations(@Query() query: any) {
    return this.chatService.listConversations(query);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string) {
    return this.chatService.getConversation(id);
  }

  @Post('conversations/:id/messages')
  addMessage(@Param('id') id: string, @Body() body: any) {
    return this.chatService.addMessage(id, body);
  }

  @Patch('conversations/:id/status')
  updateStatus(@Param('id') id: string, @Body() body: any) {
    return this.chatService.updateStatus(id, body);
  }

  @Patch('conversations/:id/read')
  markRead(
    @Param('id') id: string,
    @Body('target') target: 'customer' | 'manager' = 'customer',
  ) {
    return this.chatService.markRead(id, target);
  }
}
