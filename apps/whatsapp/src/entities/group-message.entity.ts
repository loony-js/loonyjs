import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  OneToMany,
} from '@loonyjs/typeorm';
import { ChatGroup } from './chat-group.entity';
import { AppUser } from './app-user.entity';
import { GroupMessageRead } from './group-message-read.entity';

@Entity('group_message')
@Index('idx_group_message_group', ['group_id'])
@Index('idx_group_message_sent', ['sent_at'])
export class GroupMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'group_id' })
  group_id: number;

  @Column({ name: 'sender_id' })
  sender_id: number;

  @Column({ type: 'text', nullable: true })
  body_text: string;

  @Column({ type: 'text', nullable: true })
  media_url: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'sent_at' })
  sent_at: Date;

  @ManyToOne(() => ChatGroup, (group) => group.messages, { onDelete: 'CASCADE' })
  group: ChatGroup;

  @ManyToOne(() => AppUser, (user) => user.group_messages, { onDelete: 'CASCADE' })
  sender: AppUser;

  @OneToMany(() => GroupMessageRead, (read) => read.message)
  read_receipts: GroupMessageRead[];
}
