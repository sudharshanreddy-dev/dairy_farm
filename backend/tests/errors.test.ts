import request from 'supertest';
import { app } from '../src/app';
import { prismaMock } from './setup';

describe('Global Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.status).toBe(404);
  });

  it('should return 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"username": "test", "password": }'); // Malformed

    expect(res.status).toBe(400);
  });

  it('should return 500 when database throws an error', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('DB Connection Failed'));

    // This requires the controller to catch and return 500, which they do.
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'Password123!' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
  });
});
