import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from '@loonyjs/typeorm';
import { ChatGroup } from './chat-group.entity';
import { AppUser } from './app-user.entity';

@Entity('group_member')
@Index('idx_group_member_group', ['group_id'])
@Index('idx_group_member_user', ['user_id'])
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'group_id' })
  group_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @Column({ type: 'text', default: 'member' })
  role: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joined_at: Date;

  @ManyToOne(() => ChatGroup, (group) => group.members, { onDelete: 'CASCADE' })
  group: ChatGroup;

  @ManyToOne(() => AppUser, (user) => user.group_memberships, { onDelete: 'CASCADE' })
  user: AppUser;
}
