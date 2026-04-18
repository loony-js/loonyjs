import { Injectable } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember } from '../entities/group-member.entity';

@Injectable()
export class GroupMemberService {
  constructor(
    @InjectRepository(GroupMember)
    private memberRepository: Repository<GroupMember>,
  ) {}

  async addMember(groupId: number, userId: number, role = 'member'): Promise<GroupMember> {
    const member = this.memberRepository.create({ group_id: groupId, user_id: userId, role });
    return this.memberRepository.save(member);
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    await this.memberRepository.delete({ group_id: groupId, user_id: userId });
  }

  async updateRole(groupId: number, userId: number, role: string): Promise<void> {
    await this.memberRepository.update({ group_id: groupId, user_id: userId }, { role });
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return this.memberRepository.find({ where: { group_id: groupId }, relations: ['user'] });
  }
}
