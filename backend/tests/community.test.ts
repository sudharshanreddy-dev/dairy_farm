import request from 'supertest';
import { app } from '../src/app';
import { prismaMock, createToken } from './setup';
import { prismaHelpers } from './test-utils';

const helpers = prismaHelpers(prismaMock);
const token = createToken(1, 'testuser');

describe('Community Features', () => {
  describe('Posts', () => {
    it('successfully creates a community post', async () => {
      const payload = { title: 'Best Feed for Jerseys?', content: 'Any advice?', category: 'Discussion' };
      helpers.mockCreated('communityPost', payload);

      const res = await request(app)
        .post('/api/community/posts')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(payload.title);
    });

    it('lists all posts with comment counts', async () => {
      prismaMock.communityPost.findMany.mockResolvedValue([
        { id: 1, title: 'Post 1', _count: { comments: 5 } }
      ] as any);

      const res = await request(app).get('/api/community/posts');

      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('Post 1');
    });
  });

  describe('Comments', () => {
    it('adds a comment to an existing post', async () => {
      const payload = { content: 'I recommend alfalfa!' };
      helpers.mockExists('communityPost', { id: 10 });
      helpers.mockCreated('communityComment', { ...payload, postId: 10 });

      const res = await request(app)
        .post('/api/community/posts/10/comments')
        .set('Authorization', `Bearer ${token}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(prismaMock.communityComment.create).toHaveBeenCalled();
    });
  });
});
