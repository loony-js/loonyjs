import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  OneToMany,
} from '@loonyjs/typeorm';
import { Community } from './community.entity';
import { AppUser } from './app-user.entity';
import { CommunityPostRead } from './community-post-read.entity';

@Entity('community_post')
@Index('idx_community_post_community', ['community_id'])
@Index('idx_community_post_author', ['author_id'])
@Index('idx_community_post_posted', ['posted_at'])
export class CommunityPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'community_id' })
  community_id: number;

  @Column({ name: 'author_id' })
  author_id: number;

  @Column({ type: 'text', nullable: true })
  body_text: string;

  @Column({ type: 'text', nullable: true })
  media_url: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'posted_at' })
  posted_at: Date;

  @ManyToOne(() => Community, (community) => community.posts, { onDelete: 'CASCADE' })
  community: Community;

  @ManyToOne(() => AppUser, (user) => user.community_posts, { onDelete: 'CASCADE' })
  author: AppUser;

  @OneToMany(() => CommunityPostRead, (read) => read.post)
  reads: CommunityPostRead[];
}
