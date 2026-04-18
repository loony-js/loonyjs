import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from '@loonyjs/typeorm';
import { GroupMessage } from './group-message.entity';
import { AppUser } from './app-user.entity';

@Entity('group_message_read')
@Index('idx_group_message_read_message', ['message_id'])
@Index('idx_group_message_read_user', ['user_id'])
export class GroupMessageRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'message_id' })
  message_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'read_at' })
  read_at: Date;

  @ManyToOne(() => GroupMessage, (msg) => msg.read_receipts, { onDelete: 'CASCADE' })
  message: GroupMessage;

  @ManyToOne(() => AppUser, (user) => user.post_reads, { onDelete: 'CASCADE' })
  user: AppUser;
}
