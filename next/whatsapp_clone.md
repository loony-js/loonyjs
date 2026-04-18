Below you'll find a complete NestJS implementation using **TypeORM** for the provided database schema.  
The code includes:

- All entity classes with proper relations, indexes, and column types.
- Service classes for each major entity with typical CRUD and custom business methods.
- A root module that registers the entities and exports the services.

You can copy these files directly into your NestJS project (after installing `@nestjs/typeorm`, `typeorm`, and `pg`).

---

## 1. Entities

Create a folder `src/entities/` and add the following files.

### `app-user.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { Contact } from "./contact.entity";
import { DirectMessage } from "./direct-message.entity";
import { GroupMember } from "./group-member.entity";
import { GroupMessage } from "./group-message.entity";
import { CommunityMember } from "./community-member.entity";
import { CommunityPost } from "./community-post.entity";
import { CommunityPostRead } from "./community-post-read.entity";

@Entity("app_user")
export class AppUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text", unique: true })
  phone_number: string;

  @Column({ type: "text" })
  display_name: string;

  @Column({ type: "text", nullable: true })
  profile_photo: string;

  @Column({ type: "text", nullable: true })
  about: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  // Relations
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
```

### `contact.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from "typeorm";
import { AppUser } from "./app-user.entity";

@Entity("contact")
@Index("idx_contact_owner", ["owner_user_id"])
@Index("idx_contact_contact", ["contact_user_id"])
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "owner_user_id" })
  owner_user_id: number;

  @Column({ name: "contact_user_id" })
  contact_user_id: number;

  @Column({ type: "text", nullable: true })
  alias_name: string;

  // Relations
  @ManyToOne(() => AppUser, (user) => user.contacts_owned, {
    onDelete: "CASCADE",
  })
  owner_user: AppUser;

  @ManyToOne(() => AppUser, (user) => user.contacts_as_contact, {
    onDelete: "CASCADE",
  })
  contact_user: AppUser;
}
```

### `direct-message.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { AppUser } from "./app-user.entity";

@Entity("direct_message")
@Index("idx_direct_message_sender", ["sender_id"])
@Index("idx_direct_message_receiver", ["receiver_id"])
@Index("idx_direct_message_sent", ["sent_at"])
@Index("idx_direct_message_conversation", [
  "sender_id",
  "receiver_id",
  "sent_at",
])
export class DirectMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "sender_id" })
  sender_id: number;

  @Column({ name: "receiver_id" })
  receiver_id: number;

  @Column({ type: "text", nullable: true })
  body_text: string;

  @Column({ type: "text", nullable: true })
  media_url: string;

  @Column({ type: "boolean", default: false })
  is_read: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "sent_at" })
  sent_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  read_at: Date;

  // Relations
  @ManyToOne(() => AppUser, (user) => user.sent_messages, {
    onDelete: "CASCADE",
  })
  sender: AppUser;

  @ManyToOne(() => AppUser, (user) => user.received_messages, {
    onDelete: "CASCADE",
  })
  receiver: AppUser;
}
```

### `chat-group.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { AppUser } from "./app-user.entity";
import { GroupMember } from "./group-member.entity";
import { GroupMessage } from "./group-message.entity";
import { CommunityGroup } from "./community-group.entity";

@Entity("chat_group")
export class ChatGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  profile_photo: string;

  @Column({ name: "created_by" })
  created_by: number;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  // Relations
  @ManyToOne(() => AppUser, { onDelete: "CASCADE" })
  creator: AppUser;

  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  @OneToMany(() => GroupMessage, (msg) => msg.group)
  messages: GroupMessage[];

  @OneToMany(() => CommunityGroup, (cg) => cg.group)
  community_links: CommunityGroup[];
}
```

### `group-member.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { ChatGroup } from "./chat-group.entity";
import { AppUser } from "./app-user.entity";

@Entity("group_member")
@Index("idx_group_member_group", ["group_id"])
@Index("idx_group_member_user", ["user_id"])
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "group_id" })
  group_id: number;

  @Column({ name: "user_id" })
  user_id: number;

  @Column({ type: "text", default: "member" })
  role: string; // 'member' or 'admin'

  @CreateDateColumn({ type: "timestamptz", name: "joined_at" })
  joined_at: Date;

  // Relations
  @ManyToOne(() => ChatGroup, (group) => group.members, { onDelete: "CASCADE" })
  group: ChatGroup;

  @ManyToOne(() => AppUser, (user) => user.group_memberships, {
    onDelete: "CASCADE",
  })
  user: AppUser;
}
```

### `group-message.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { ChatGroup } from "./chat-group.entity";
import { AppUser } from "./app-user.entity";
import { GroupMessageRead } from "./group-message-read.entity";

@Entity("group_message")
@Index("idx_group_message_group", ["group_id"])
@Index("idx_group_message_sent", ["sent_at"])
export class GroupMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "group_id" })
  group_id: number;

  @Column({ name: "sender_id" })
  sender_id: number;

  @Column({ type: "text", nullable: true })
  body_text: string;

  @Column({ type: "text", nullable: true })
  media_url: string;

  @CreateDateColumn({ type: "timestamptz", name: "sent_at" })
  sent_at: Date;

  // Relations
  @ManyToOne(() => ChatGroup, (group) => group.messages, {
    onDelete: "CASCADE",
  })
  group: ChatGroup;

  @ManyToOne(() => AppUser, (user) => user.group_messages, {
    onDelete: "CASCADE",
  })
  sender: AppUser;

  @OneToMany(() => GroupMessageRead, (read) => read.message)
  read_receipts: GroupMessageRead[];
}
```

### `group-message-read.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { GroupMessage } from "./group-message.entity";
import { AppUser } from "./app-user.entity";

@Entity("group_message_read")
@Index("idx_group_message_read_message", ["message_id"])
@Index("idx_group_message_read_user", ["user_id"])
export class GroupMessageRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "message_id" })
  message_id: number;

  @Column({ name: "user_id" })
  user_id: number;

  @CreateDateColumn({ type: "timestamptz", name: "read_at" })
  read_at: Date;

  // Relations
  @ManyToOne(() => GroupMessage, (msg) => msg.read_receipts, {
    onDelete: "CASCADE",
  })
  message: GroupMessage;

  @ManyToOne(() => AppUser, (user) => user.post_reads, { onDelete: "CASCADE" })
  user: AppUser;
}
```

### `community.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { AppUser } from "./app-user.entity";
import { CommunityMember } from "./community-member.entity";
import { CommunityGroup } from "./community-group.entity";
import { CommunityPost } from "./community-post.entity";

@Entity("community")
export class Community {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "text", nullable: true })
  profile_photo: string;

  @Column({ name: "created_by" })
  created_by: number;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  created_at: Date;

  // Relations
  @ManyToOne(() => AppUser, { onDelete: "CASCADE" })
  creator: AppUser;

  @OneToMany(() => CommunityMember, (member) => member.community)
  members: CommunityMember[];

  @OneToMany(() => CommunityGroup, (cg) => cg.community)
  groups: CommunityGroup[];

  @OneToMany(() => CommunityPost, (post) => post.community)
  posts: CommunityPost[];
}
```

### `community-member.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Community } from "./community.entity";
import { AppUser } from "./app-user.entity";

@Entity("community_member")
@Index("idx_community_member_community", ["community_id"])
@Index("idx_community_member_user", ["user_id"])
export class CommunityMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "community_id" })
  community_id: number;

  @Column({ name: "user_id" })
  user_id: number;

  @Column({ type: "text", default: "member" })
  role: string;

  @CreateDateColumn({ type: "timestamptz", name: "joined_at" })
  joined_at: Date;

  // Relations
  @ManyToOne(() => Community, (community) => community.members, {
    onDelete: "CASCADE",
  })
  community: Community;

  @ManyToOne(() => AppUser, (user) => user.community_memberships, {
    onDelete: "CASCADE",
  })
  user: AppUser;
}
```

### `community-group.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from "typeorm";
import { Community } from "./community.entity";
import { ChatGroup } from "./chat-group.entity";

@Entity("community_group")
@Index("idx_community_group_community", ["community_id"])
@Index("idx_community_group_group", ["group_id"])
export class CommunityGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "community_id" })
  community_id: number;

  @Column({ name: "group_id" })
  group_id: number;

  // Relations
  @ManyToOne(() => Community, (community) => community.groups, {
    onDelete: "CASCADE",
  })
  community: Community;

  @ManyToOne(() => ChatGroup, (group) => group.community_links, {
    onDelete: "CASCADE",
  })
  group: ChatGroup;
}
```

### `community-post.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Community } from "./community.entity";
import { AppUser } from "./app-user.entity";
import { CommunityPostRead } from "./community-post-read.entity";

@Entity("community_post")
@Index("idx_community_post_community", ["community_id"])
@Index("idx_community_post_author", ["author_id"])
@Index("idx_community_post_posted", ["posted_at"])
export class CommunityPost {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "community_id" })
  community_id: number;

  @Column({ name: "author_id" })
  author_id: number;

  @Column({ type: "text", nullable: true })
  body_text: string;

  @Column({ type: "text", nullable: true })
  media_url: string;

  @CreateDateColumn({ type: "timestamptz", name: "posted_at" })
  posted_at: Date;

  // Relations
  @ManyToOne(() => Community, (community) => community.posts, {
    onDelete: "CASCADE",
  })
  community: Community;

  @ManyToOne(() => AppUser, (user) => user.community_posts, {
    onDelete: "CASCADE",
  })
  author: AppUser;

  @OneToMany(() => CommunityPostRead, (read) => read.post)
  reads: CommunityPostRead[];
}
```

### `community-post-read.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
} from "typeorm";
import { CommunityPost } from "./community-post.entity";
import { AppUser } from "./app-user.entity";

@Entity("community_post_read")
@Index("idx_community_post_read_post", ["post_id"])
@Index("idx_community_post_read_user", ["user_id"])
export class CommunityPostRead {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "post_id" })
  post_id: number;

  @Column({ name: "user_id" })
  user_id: number;

  @CreateDateColumn({ type: "timestamptz", name: "read_at" })
  read_at: Date;

  // Relations
  @ManyToOne(() => CommunityPost, (post) => post.reads, { onDelete: "CASCADE" })
  post: CommunityPost;

  @ManyToOne(() => AppUser, (user) => user.post_reads, { onDelete: "CASCADE" })
  user: AppUser;
}
```

---

## 2. Services

Create a folder `src/services/` and add the following service files.  
Each service uses the TypeORM repository pattern.

### `app-user.service.ts`

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppUser } from "../entities/app-user.entity";

@Injectable()
export class AppUserService {
  constructor(
    @InjectRepository(AppUser)
    private userRepository: Repository<AppUser>,
  ) {}

  async create(data: Partial<AppUser>): Promise<AppUser> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<AppUser[]> {
    return this.userRepository.find();
  }

  async findById(id: number): Promise<AppUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByPhone(phone: string): Promise<AppUser | null> {
    return this.userRepository.findOne({ where: { phone_number: phone } });
  }

  async update(id: number, data: Partial<AppUser>): Promise<AppUser> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`User ${id} not found`);
  }
}
```

### `contact.service.ts`

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Contact } from "../entities/contact.entity";

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  async addContact(
    ownerUserId: number,
    contactUserId: number,
    alias?: string,
  ): Promise<Contact> {
    const contact = this.contactRepository.create({
      owner_user_id: ownerUserId,
      contact_user_id: contactUserId,
      alias_name: alias,
    });
    return this.contactRepository.save(contact);
  }

  async getContactsOfUser(userId: number): Promise<Contact[]> {
    return this.contactRepository.find({
      where: { owner_user_id: userId },
      relations: ["contact_user"],
    });
  }

  async removeContact(
    ownerUserId: number,
    contactUserId: number,
  ): Promise<void> {
    const result = await this.contactRepository.delete({
      owner_user_id: ownerUserId,
      contact_user_id: contactUserId,
    });
    if (result.affected === 0) throw new NotFoundException("Contact not found");
  }
}
```

### `direct-message.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DirectMessage } from "../entities/direct-message.entity";

@Injectable()
export class DirectMessageService {
  constructor(
    @InjectRepository(DirectMessage)
    private dmRepository: Repository<DirectMessage>,
  ) {}

  async sendMessage(
    senderId: number,
    receiverId: number,
    body?: string,
    media?: string,
  ): Promise<DirectMessage> {
    const msg = this.dmRepository.create({
      sender_id: senderId,
      receiver_id: receiverId,
      body_text: body,
      media_url: media,
    });
    return this.dmRepository.save(msg);
  }

  async getConversation(
    user1Id: number,
    user2Id: number,
    limit = 50,
  ): Promise<DirectMessage[]> {
    return this.dmRepository
      .createQueryBuilder("dm")
      .where(
        "(dm.sender_id = :user1 AND dm.receiver_id = :user2) OR (dm.sender_id = :user2 AND dm.receiver_id = :user1)",
        { user1: user1Id, user2: user2Id },
      )
      .orderBy("dm.sent_at", "DESC")
      .limit(limit)
      .getMany();
  }

  async markAsRead(messageId: number): Promise<void> {
    await this.dmRepository.update(messageId, {
      is_read: true,
      read_at: new Date(),
    });
  }
}
```

### `chat-group.service.ts`

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatGroup } from "../entities/chat-group.entity";

@Injectable()
export class ChatGroupService {
  constructor(
    @InjectRepository(ChatGroup)
    private groupRepository: Repository<ChatGroup>,
  ) {}

  async create(data: Partial<ChatGroup>): Promise<ChatGroup> {
    const group = this.groupRepository.create(data);
    return this.groupRepository.save(group);
  }

  async findById(id: number): Promise<ChatGroup> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ["members", "messages"],
    });
    if (!group) throw new NotFoundException(`Group ${id} not found`);
    return group;
  }

  async update(id: number, data: Partial<ChatGroup>): Promise<ChatGroup> {
    await this.groupRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.groupRepository.delete(id);
  }
}
```

### `group-member.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupMember } from "../entities/group-member.entity";

@Injectable()
export class GroupMemberService {
  constructor(
    @InjectRepository(GroupMember)
    private memberRepository: Repository<GroupMember>,
  ) {}

  async addMember(
    groupId: number,
    userId: number,
    role = "member",
  ): Promise<GroupMember> {
    const member = this.memberRepository.create({
      group_id: groupId,
      user_id: userId,
      role,
    });
    return this.memberRepository.save(member);
  }

  async removeMember(groupId: number, userId: number): Promise<void> {
    await this.memberRepository.delete({ group_id: groupId, user_id: userId });
  }

  async updateRole(
    groupId: number,
    userId: number,
    role: string,
  ): Promise<void> {
    await this.memberRepository.update(
      { group_id: groupId, user_id: userId },
      { role },
    );
  }

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return this.memberRepository.find({
      where: { group_id: groupId },
      relations: ["user"],
    });
  }
}
```

### `group-message.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { GroupMessage } from "../entities/group-message.entity";
import { GroupMessageRead } from "../entities/group-message-read.entity";

@Injectable()
export class GroupMessageService {
  constructor(
    @InjectRepository(GroupMessage)
    private msgRepository: Repository<GroupMessage>,
    @InjectRepository(GroupMessageRead)
    private readRepository: Repository<GroupMessageRead>,
  ) {}

  async sendMessage(
    groupId: number,
    senderId: number,
    body?: string,
    media?: string,
  ): Promise<GroupMessage> {
    const msg = this.msgRepository.create({
      group_id: groupId,
      sender_id: senderId,
      body_text: body,
      media_url: media,
    });
    return this.msgRepository.save(msg);
  }

  async getGroupMessages(groupId: number, limit = 50): Promise<GroupMessage[]> {
    return this.msgRepository.find({
      where: { group_id: groupId },
      order: { sent_at: "DESC" },
      take: limit,
    });
  }

  async markAsRead(messageId: number, userId: number): Promise<void> {
    const existing = await this.readRepository.findOne({
      where: { message_id: messageId, user_id: userId },
    });
    if (!existing) {
      const read = this.readRepository.create({
        message_id: messageId,
        user_id: userId,
      });
      await this.readRepository.save(read);
    }
  }
}
```

### `community.service.ts`

```typescript
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Community } from "../entities/community.entity";

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private communityRepository: Repository<Community>,
  ) {}

  async create(data: Partial<Community>): Promise<Community> {
    const community = this.communityRepository.create(data);
    return this.communityRepository.save(community);
  }

  async findById(id: number): Promise<Community> {
    const community = await this.communityRepository.findOne({
      where: { id },
      relations: ["members", "groups", "posts"],
    });
    if (!community) throw new NotFoundException(`Community ${id} not found`);
    return community;
  }

  async update(id: number, data: Partial<Community>): Promise<Community> {
    await this.communityRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.communityRepository.delete(id);
  }
}
```

### `community-member.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommunityMember } from "../entities/community-member.entity";

@Injectable()
export class CommunityMemberService {
  constructor(
    @InjectRepository(CommunityMember)
    private memberRepository: Repository<CommunityMember>,
  ) {}

  async addMember(
    communityId: number,
    userId: number,
    role = "member",
  ): Promise<CommunityMember> {
    const member = this.memberRepository.create({
      community_id: communityId,
      user_id: userId,
      role,
    });
    return this.memberRepository.save(member);
  }

  async removeMember(communityId: number, userId: number): Promise<void> {
    await this.memberRepository.delete({
      community_id: communityId,
      user_id: userId,
    });
  }

  async getCommunityMembers(communityId: number): Promise<CommunityMember[]> {
    return this.memberRepository.find({
      where: { community_id: communityId },
      relations: ["user"],
    });
  }
}
```

### `community-post.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommunityPost } from "../entities/community-post.entity";
import { CommunityPostRead } from "../entities/community-post-read.entity";

@Injectable()
export class CommunityPostService {
  constructor(
    @InjectRepository(CommunityPost)
    private postRepository: Repository<CommunityPost>,
    @InjectRepository(CommunityPostRead)
    private readRepository: Repository<CommunityPostRead>,
  ) {}

  async createPost(
    communityId: number,
    authorId: number,
    body?: string,
    media?: string,
  ): Promise<CommunityPost> {
    const post = this.postRepository.create({
      community_id: communityId,
      author_id: authorId,
      body_text: body,
      media_url: media,
    });
    return this.postRepository.save(post);
  }

  async getCommunityPosts(communityId: number): Promise<CommunityPost[]> {
    return this.postRepository.find({
      where: { community_id: communityId },
      order: { posted_at: "DESC" },
    });
  }

  async markPostAsRead(postId: number, userId: number): Promise<void> {
    const existing = await this.readRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
    if (!existing) {
      const read = this.readRepository.create({
        post_id: postId,
        user_id: userId,
      });
      await this.readRepository.save(read);
    }
  }
}
```

---

## 3. Root Module

Create `src/chat.module.ts` (or integrate into your `app.module.ts`):

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

// Entities
import { AppUser } from "./entities/app-user.entity";
import { Contact } from "./entities/contact.entity";
import { DirectMessage } from "./entities/direct-message.entity";
import { ChatGroup } from "./entities/chat-group.entity";
import { GroupMember } from "./entities/group-member.entity";
import { GroupMessage } from "./entities/group-message.entity";
import { GroupMessageRead } from "./entities/group-message-read.entity";
import { Community } from "./entities/community.entity";
import { CommunityMember } from "./entities/community-member.entity";
import { CommunityGroup } from "./entities/community-group.entity";
import { CommunityPost } from "./entities/community-post.entity";
import { CommunityPostRead } from "./entities/community-post-read.entity";

// Services
import { AppUserService } from "./services/app-user.service";
import { ContactService } from "./services/contact.service";
import { DirectMessageService } from "./services/direct-message.service";
import { ChatGroupService } from "./services/chat-group.service";
import { GroupMemberService } from "./services/group-member.service";
import { GroupMessageService } from "./services/group-message.service";
import { CommunityService } from "./services/community.service";
import { CommunityMemberService } from "./services/community-member.service";
import { CommunityPostService } from "./services/community-post.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppUser,
      Contact,
      DirectMessage,
      ChatGroup,
      GroupMember,
      GroupMessage,
      GroupMessageRead,
      Community,
      CommunityMember,
      CommunityGroup,
      CommunityPost,
      CommunityPostRead,
    ]),
  ],
  providers: [
    AppUserService,
    ContactService,
    DirectMessageService,
    ChatGroupService,
    GroupMemberService,
    GroupMessageService,
    CommunityService,
    CommunityMemberService,
    CommunityPostService,
  ],
  exports: [
    AppUserService,
    ContactService,
    DirectMessageService,
    ChatGroupService,
    GroupMemberService,
    GroupMessageService,
    CommunityService,
    CommunityMemberService,
    CommunityPostService,
  ],
})
export class ChatModule {}
```

---

## 4. Database Connection (example `app.module.ts`)

Make sure you configure TypeORM in your root module:

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ChatModule } from "./chat.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: "localhost",
      port: 5432,
      username: "your_user",
      password: "your_password",
      database: "your_db",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true, // set to false in production
    }),
    ChatModule,
  ],
})
export class AppModule {}
```

---

## Notes

- The `synchronize: true` option will automatically create the tables based on your entities. For production, use migrations instead.
- All foreign keys are configured with `onDelete: 'CASCADE'` to match the SQL script.
- Indexes are defined using the `@Index` decorator.
- Services contain typical methods; you can extend them with additional business logic as needed.

Now you have a fully functional NestJS backend matching your database schema.
