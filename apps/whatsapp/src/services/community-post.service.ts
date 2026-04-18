import { Injectable } from '@loonyjs/core';
import { InjectRepository } from '@loonyjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityPost } from '../entities/community-post.entity';
import { CommunityPostRead } from '../entities/community-post-read.entity';

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
      order: { posted_at: 'DESC' },
    });
  }

  async markPostAsRead(postId: number, userId: number): Promise<void> {
    const existing = await this.readRepository.findOne({
      where: { post_id: postId, user_id: userId },
    });
    if (!existing) {
      const read = this.readRepository.create({ post_id: postId, user_id: userId });
      await this.readRepository.save(read);
    }
  }
}
