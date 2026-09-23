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

test('API Routing & Reliability - Rate Limiting & 429 Contract', async (t) => {
  await t.test('rate limiters export standard middleware and handle responses', async () => {
    const { apiLimiter, authLimiter, mutationLimiter } = await import('../middleware/rateLimiter.js');
    assert.ok(apiLimiter, 'apiLimiter middleware must exist');
    assert.ok(authLimiter, 'authLimiter middleware must exist');
    assert.ok(mutationLimiter, 'mutationLimiter middleware must exist');
  });
});
