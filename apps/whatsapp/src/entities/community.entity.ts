import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from '@loonyjs/typeorm';
import { AppUser } from './app-user.entity';
import { CommunityMember } from './community-member.entity';
import { CommunityGroup } from './community-group.entity';
import { CommunityPost } from './community-post.entity';

@Entity('community')
export class Community {
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

  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => CommunityGroup, (cg) => cg.community)
  groups: CommunityGroup[];

  @OneToMany(() => CommunityPost, (post) => post.community)
  posts: CommunityPost[];
}
