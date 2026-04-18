import { Injectable } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMessage } from '../entities/group-message.entity';
import { GroupMessageRead } from '../entities/group-message-read.entity';

@Injectable()
export class GroupMessageService {
  constructor(
    @InjectRepository(GroupMessage)
    private msgRepository: Repository<GroupMessage>,
    @InjectRepository(GroupMessageRead)
    private readRepository: Repository<GroupMessageRead>,
  ) {}

  async sendMessage(
    groupId: number,
    senderId: number,
    body?: string,
    media?: string,
  ): Promise<GroupMessage> {
    const msg = this.msgRepository.create({
      group_id: groupId,
      sender_id: senderId,
      body_text: body,
      media_url: media,
    });
    return this.msgRepository.save(msg);
  }

  async getGroupMessages(groupId: number, limit = 50): Promise<GroupMessage[]> {
    return this.msgRepository.find({
      where: { group_id: groupId },
      order: { sent_at: 'DESC' },
      take: limit,
    });
  }

  async markAsRead(messageId: number, userId: number): Promise<void> {
    const existing = await this.readRepository.findOne({
      where: { message_id: messageId, user_id: userId },
    });
    if (!existing) {
      const read = this.readRepository.create({ message_id: messageId, user_id: userId });
      await this.readRepository.save(read);
    }
  }
}
