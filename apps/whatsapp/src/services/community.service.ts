import { Injectable, NotFoundException } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { Community } from '../entities/community.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
  ) {}

  async create(data: Partial<Community>): Promise<Community> {
    const community = this.communityRepository.create(data);
    return this.communityRepository.save(community);
  }

  async findById(id: number): Promise<Community> {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ['members', 'groups', 'posts'],
    });
    if (!community) throw new NotFoundException(`Community ${id} not found`);
    return community;
  }

  async update(id: number, data: Partial<Community>): Promise<Community> {
    await this.communityRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.communityRepository.delete(id);
  }
}
