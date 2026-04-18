import { Controller, Get, Post, Put, Body, Param, Query } from '@loonyjs/core';
import { DirectMessageService } from '../services/direct-message.service';
import { DirectMessage } from '../entities/direct-message.entity';

@Controller('messages')
export class DirectMessageController {
  constructor(private readonly dmService: DirectMessageService) {}

  @Post()
  send(
    @Body() body: { sender_id: number; receiver_id: number; body_text?: string; media_url?: string },
  ): Promise<DirectMessage> {
    return this.dmService.sendMessage(
      body.sender_id,
      body.receiver_id,
      body.body_text,
      body.media_url,
    );
  }

  @Get('conversation')
  getConversation(
    @Query('user1') user1: string,
    @Query('user2') user2: string,
    @Query('limit') limit?: string,
  ): Promise<DirectMessage[]> {
    return this.dmService.getConversation(Number(user1), Number(user2), limit ? Number(limit) : 50);
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string): Promise<void> {
    return this.dmService.markAsRead(Number(id));
  }
}
