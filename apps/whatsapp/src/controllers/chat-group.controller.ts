import { Controller, Get, Post, Put, Delete, Body, Param } from '@loonyjs/core';
import { ChatGroupService } from '../services/chat-group.service';
import { GroupMemberService } from '../services/group-member.service';
import { GroupMessageService } from '../services/group-message.service';
import { ChatGroup } from '../entities/chat-group.entity';

@Controller('groups')
export class ChatGroupController {
  constructor(
    private readonly groupService: ChatGroupService,
    private readonly memberService: GroupMemberService,
    private readonly messageService: GroupMessageService,
  ) {}

  @Post()
  create(@Body() body: Partial<ChatGroup>): Promise<ChatGroup> {
    return this.groupService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<ChatGroup> {
    return this.groupService.findById(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: Partial<ChatGroup>): Promise<ChatGroup> {
    return this.groupService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.groupService.delete(Number(id));
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() body: { user_id: number; role?: string },
  ) {
    return this.memberService.addMember(Number(id), body.user_id, body.role);
  }

  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.memberService.getGroupMembers(Number(id));
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    return this.memberService.removeMember(Number(id), Number(userId));
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { sender_id: number; body_text?: string; media_url?: string },
  ) {
    return this.messageService.sendMessage(Number(id), body.sender_id, body.body_text, body.media_url);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.messageService.getGroupMessages(Number(id));
  }
}
