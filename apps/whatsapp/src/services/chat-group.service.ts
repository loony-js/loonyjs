import { Injectable, NotFoundException } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { ChatGroup } from '../entities/chat-group.entity';

@Injectable()
export class ChatGroupService {
  constructor(
    @InjectRepository(ChatGroup)
    private groupRepository: Repository<ChatGroup>,
  ) {}

  async create(data: Partial<ChatGroup>): Promise<ChatGroup> {
    const group = this.groupRepository.create(data);
    return this.groupRepository.save(group);
  }

  async findById(id: number): Promise<ChatGroup> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['members', 'messages'],
    });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  async update(id: number, data: Partial<ChatGroup>): Promise<ChatGroup> {
    await this.groupRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.groupRepository.delete(id);
  }
}
