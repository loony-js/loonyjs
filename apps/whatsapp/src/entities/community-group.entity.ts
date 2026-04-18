import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from '@loonyjs/typeorm';
import { Community } from './community.entity';
import { ChatGroup } from './chat-group.entity';

@Entity('community_group')
@Index('idx_community_group_community', ['community_id'])
@Index('idx_community_group_group', ['group_id'])
export class CommunityGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'community_id' })
  community_id: number;

  @Column({ name: 'group_id' })
  group_id: number;

  @ManyToOne(() => Community, (community) => community.groups, { onDelete: 'CASCADE' })
  community: Community;

  @ManyToOne(() => ChatGroup, (group) => group.community_links, { onDelete: 'CASCADE' })
  group: ChatGroup;
}
