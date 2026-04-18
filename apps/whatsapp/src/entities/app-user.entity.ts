import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from '@loonyjs/typeorm';
import { Contact } from './contact.entity';
import { DirectMessage } from './direct-message.entity';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity';
import { CommunityMember } from './community-member.entity';
import { CommunityPost } from './community-post.entity';
import { CommunityPostRead } from './community-post-read.entity';

@Entity('app_user')
export class AppUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', unique: true })
  phone_number: string;

  @Column({ type: 'text' })
  display_name: string;

  @Column({ type: 'text', nullable: true })
  profile_photo: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  created_at: Date;

  @OneToMany(() => Contact, (contact) => contact.owner_user)
  contacts_owned: Contact[];

  @OneToMany(() => Contact, (contact) => contact.contact_user)
  contacts_as_contact: Contact[];

  @OneToMany(() => DirectMessage, (msg) => msg.sender)
  sent_messages: DirectMessage[];

  @OneToMany(() => DirectMessage, (msg) => msg.receiver)
  received_messages: DirectMessage[];

  @OneToMany(() => GroupMember, (gm) => gm.user)
  group_memberships: GroupMember[];

  @OneToMany(() => GroupMessage, (gm) => gm.sender)
  group_messages: GroupMessage[];

  @OneToMany(() => CommunityMember, (cm) => cm.user)
  community_memberships: CommunityMember[];

  @OneToMany(() => CommunityPost, (post) => post.author)
  community_posts: CommunityPost[];

  @OneToMany(() => CommunityPostRead, (read) => read.user)
  post_reads: CommunityPostRead[];
}
