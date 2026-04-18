import { Module } from '@loonyjs/core';
import { TypeOrmModule } from '@loonyjs/typeorm';

import { AppUser } from '../entities/app-user.entity';
import { Contact } from '../entities/contact.entity';
import { DirectMessage } from '../entities/direct-message.entity';
import { ChatGroup } from '../entities/chat-group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { GroupMessage } from '../entities/group-message.entity';
import { GroupMessageRead } from '../entities/group-message-read.entity';
import { Community } from '../entities/community.entity';
import { CommunityMember } from '../entities/community-member.entity';
import { CommunityGroup } from '../entities/community-group.entity';
import { CommunityPost } from '../entities/community-post.entity';
import { CommunityPostRead } from '../entities/community-post-read.entity';

import { AppUserService } from '../services/app-user.service';
import { ContactService } from '../services/contact.service';
import { DirectMessageService } from '../services/direct-message.service';
import { ChatGroupService } from '../services/chat-group.service';
import { GroupMemberService } from '../services/group-member.service';
import { GroupMessageService } from '../services/group-message.service';
import { CommunityService } from '../services/community.service';
import { CommunityMemberService } from '../services/community-member.service';
import { CommunityPostService } from '../services/community-post.service';
import { AppUserController } from '../controllers/app-user.controller';
import { DirectMessageController } from '../controllers/direct-message.controller';
import { ChatGroupController } from '../controllers/chat-group.controller';

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
  controllers: [AppUserController, DirectMessageController, ChatGroupController],
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
