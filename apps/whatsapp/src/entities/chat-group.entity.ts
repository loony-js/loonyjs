import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from '@loonyjs/typeorm';
import { AppUser } from './app-user.entity';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity';
import { CommunityGroup } from './community-group.entity';

@Entity('chat_group')
export class ChatGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  profile_photo: string;

  @Column({ name: 'created_by' })
  created_by: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  creator: AppUser;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @OneToMany(() => GroupMessage, (msg) => msg.group)
  messages: GroupMessage[];

  @OneToMany(() => CommunityGroup, (cg) => cg.group)
  community_links: CommunityGroup[];
}
