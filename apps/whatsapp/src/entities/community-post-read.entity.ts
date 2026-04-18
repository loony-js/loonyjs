import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from '@loonyjs/typeorm';
import { CommunityPost } from './community-post.entity';
import { AppUser } from './app-user.entity';

@Entity('community_post_read')
@Index('idx_community_post_read_post', ['post_id'])
@Index('idx_community_post_read_user', ['user_id'])
export class CommunityPostRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  post_id: number;

  @Column({ name: 'user_id' })
  user_id: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'read_at' })
  read_at: Date;

  @ManyToOne(() => CommunityPost, (post) => post.reads, { onDelete: 'CASCADE' })
  post: CommunityPost;

  @ManyToOne(() => AppUser, (user) => user.post_reads, { onDelete: 'CASCADE' })
  user: AppUser;
}
