import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from '@loonyjs/typeorm';
import { AppUser } from './app-user.entity';

@Entity('direct_message')
@Index('idx_direct_message_sender', ['sender_id'])
@Index('idx_direct_message_receiver', ['receiver_id'])
@Index('idx_direct_message_sent', ['sent_at'])
@Index('idx_direct_message_conversation', ['sender_id', 'receiver_id', 'sent_at'])
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'sender_id' })
  sender_id: number;

  @Column({ name: 'receiver_id' })
  receiver_id: number;

  @Column({ type: 'text', nullable: true })
  body_text: string;

  @Column({ type: 'text', nullable: true })
  media_url: string;

  @Column({ type: 'boolean', default: false })
  is_read: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'sent_at' })
  sent_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  read_at: Date;

  @ManyToOne(() => AppUser, (user) => user.sent_messages, { onDelete: 'CASCADE' })
  sender: AppUser;

  @ManyToOne(() => AppUser, (user) => user.received_messages, { onDelete: 'CASCADE' })
  receiver: AppUser;
}
