import { Injectable } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityMember } from '../entities/community-member.entity';

@Injectable()
export class CommunityMemberService {
  constructor(
    @InjectRepository(CommunityMember)
    private memberRepository: Repository<CommunityMember>,
  ) {}

  async addMember(communityId: number, userId: number, role = 'member'): Promise<CommunityMember> {
    const member = this.memberRepository.create({
      community_id: communityId,
      user_id: userId,
      role,
    });
    return this.memberRepository.save(member);
  }

  async removeMember(communityId: number, userId: number): Promise<void> {
    await this.memberRepository.delete({ community_id: communityId, user_id: userId });
  }

  async getCommunityMembers(communityId: number): Promise<CommunityMember[]> {
    return this.memberRepository.find({
      where: { community_id: communityId },
      relations: ['user'],
    });
  }
}
