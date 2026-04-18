import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from '@loonyjs/typeorm';
import { Community } from './community.entity';
import { AppUser } from './app-user.entity';

@Entity('community_member')
@Index('idx_community_member_community', ['community_id'])
@Index('idx_community_member_user', ['user_id'])
export class CommunityMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'community_id' })
  community_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ type: 'text', default: 'member' })
  role: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joined_at: Date;

  @ManyToOne(() => Community, (community) => community.members, { onDelete: 'CASCADE' })
  community: Community;

  @ManyToOne(() => AppUser, (user) => user.community_memberships, { onDelete: 'CASCADE' })
  user: AppUser;
}
