import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import app from '../app.js';
import Story from '../models/Story.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';

afterEach(() => mock.restoreAll());

async function createTestHttp(t) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  return {
    get: (path, headers = {}) => fetch(base + path, { method: 'GET', headers }),
    post: (path, body, headers = {}) => fetch(base + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body)
    })
  };
}

test('API Routing & Reliability - Stories Endpoint', async (t) => {
  await t.test('GET /api/stories is mounted and returns 200 array with active stories', async () => {
    const mockStories = [
      {
        _id: '507f1f77bcf86cd799439099',
        mediaUrl: 'https://example.com/story1.jpg',
        caption: 'Sunset moment',
        author: { _id: '507f1f77bcf86cd799439011', username: 'alice', displayName: 'Alice' },
        createdAt: new Date()
      }
    ];

    mock.method(Story, 'find', () => ({
      populate: () => ({
        sort: async () => mockStories
      })
    }));

    const http = await createTestHttp(t);
    const res = await http.get('/api/stories');
    assert.equal(res.status, 200, 'GET /api/stories must return HTTP 200');
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Stories response must be an array');
    assert.equal(data.length, 1);
    assert.equal(data[0].caption, 'Sunset moment');
  });

  await t.test('GET /api/stories returns empty array when no active stories', async () => {
    mock.method(Story, 'find', () => ({
      populate: () => ({
        sort: async () => []
      })
    }));

    const http = await createTestHttp(t);
    const res = await http.get('/api/stories');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 0);
  });
});

test('API Routing & Reliability - Profile & User Endpoints', async (t) => {
  const User = (await import('../models/User.js')).default;
  const Follow = (await import('../models/Follow.js')).default;
  const Post = (await import('../models/Post.js')).default;

  await t.test('GET /api/users/profile/:username resolves user profile by username', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'inderash10',
      displayName: 'Inderash',
      avatar: 'https://example.com/avatar.jpg',
      bio: 'Fullstack developer',
      isBanned: false,
      privacySettings: { isPrivate: false, allowDirectMessages: true },
      createdAt: new Date()
    };

    mock.method(User, 'findOne', () => ({
      select: async () => mockUser
    }));
    mock.method(Follow, 'countDocuments', async () => 5);
    mock.method(Post, 'countDocuments', async () => 2);
    mock.method(Post, 'find', () => ({
      populate: () => ({
        sort: () => ({
          limit: async () => []
        })
      })
    }));

    const http = await createTestHttp(t);
    const res = await http.get('/api/users/profile/inderash10');
    assert.equal(res.status, 200, 'GET /api/users/profile/inderash10 must return HTTP 200');
    const data = await res.json();
    assert.ok(data.profile, 'Response must have profile object');
    assert.equal(data.profile.username, 'inderash10');
    assert.equal(data.profile.followersCount, 5);
  });

  await t.test('GET /api/users/profile/:username returns 404 for nonexistent user', async () => {
    mock.method(User, 'findOne', () => ({
      select: async () => null
    }));

    const http = await createTestHttp(t);
    const res = await http.get('/api/users/profile/nonexistent_user_999');
    assert.equal(res.status, 404, 'Nonexistent user must return 404');
  });

  await t.test('GET /api/users/:id/followers resolves followers by username or ID', async () => {
    mock.method(User, 'findOne', async () => ({ _id: '507f1f77bcf86cd799439011' }));
    mock.method(Follow, 'find', () => ({
      populate: () => ({
        sort: async () => [
          { follower: { _id: '507f1f77bcf86cd799439022', username: 'follower1', displayName: 'Follower One' } }
        ]
      })
    }));

    const http = await createTestHttp(t);
    const res = await http.get('/api/users/inderash10/followers');
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.equal(data.length, 1);
    assert.equal(data[0].username, 'follower1');
  });
});

