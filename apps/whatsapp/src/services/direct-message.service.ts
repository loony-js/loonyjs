import { Injectable } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { DirectMessage } from '../entities/direct-message.entity';

@Injectable()
export class DirectMessageService {
  constructor(
    @InjectRepository(DirectMessage)
    private dmRepository: Repository<DirectMessage>,
  ) {}

  async sendMessage(
    senderId: number,
    receiverId: number,
    body?: string,
    media?: string,
  ): Promise<DirectMessage> {
    const msg = this.dmRepository.create({
      sender_id: senderId,
      receiver_id: receiverId,
      body_text: body,
      media_url: media,
    });
    return this.dmRepository.save(msg);
  }

  async getConversation(user1Id: number, user2Id: number, limit = 50): Promise<DirectMessage[]> {
    return this.dmRepository
      .createQueryBuilder('dm')
      .where(
        '(dm.sender_id = :user1 AND dm.receiver_id = :user2) OR (dm.sender_id = :user2 AND dm.receiver_id = :user1)',
        { user1: user1Id, user2: user2Id },
      )
      .orderBy('dm.sent_at', 'DESC')
      .limit(limit)
      .getMany();
  }

  async markAsRead(messageId: number): Promise<void> {
    await this.dmRepository.update(messageId, { is_read: true, read_at: new Date() });
  }
}
