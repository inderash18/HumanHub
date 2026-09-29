import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import Story from '../models/Story.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Follow from '../models/Follow.js';
import Block from '../models/Block.js';

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
    }),
    delete: (path, headers = {}) => fetch(base + path, {
      method: 'DELETE',
      headers
    })
  };
}

const userA = {
  _id: '507f1f77bcf86cd799439011',
  username: 'user_a',
  displayName: 'User A',
  email: 'user_a@example.com',
  role: 'user',
  isBanned: false,
  emailVerified: true,
  privacySettings: { isPrivate: false }
};

const userB = {
  _id: '507f1f77bcf86cd799439022',
  username: 'user_b',
  displayName: 'User B',
  email: 'user_b@example.com',
  role: 'user',
  isBanned: false,
  emailVerified: true,
  privacySettings: { isPrivate: false }
};

const sessionA = { _id: '507f1f77bcf86cd799439033', user: userA._id };
const sessionB = { _id: '507f1f77bcf86cd799439044', user: userB._id };

const tokenA = jwt.sign(
  { id: userA._id, sid: sessionA._id, aud: 'humanhub-client', iss: 'humanhub' },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const tokenB = jwt.sign(
  { id: userB._id, sid: sessionB._id, aud: 'humanhub-client', iss: 'humanhub' },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

const query = value => ({
  select: () => ({
    then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
  }),
  then: (resolve, reject) => Promise.resolve(value).then(resolve, reject)
});

function setupAuthMocks() {
  mock.method(User, 'findById', (id) => {
    if (String(id) === userA._id) return query(userA);
    if (String(id) === userB._id) return query(userB);
    return query(null);
  });

  mock.method(Session, 'findOne', async (filter) => {
    if (filter && String(filter.user) === userA._id) return sessionA;
    if (filter && String(filter.user) === userB._id) return sessionB;
    if (filter && String(filter._id) === sessionA._id) return sessionA;
    if (filter && String(filter._id) === sessionB._id) return sessionB;
    return sessionA;
  });
}

test('Stories Feature - Authoritative Ownership and Permissions', async (t) => {
  await t.test('POST /api/stories assigns author strictly from authenticated session', async () => {
    setupAuthMocks();
    let createdStoryDoc = null;

    mock.method(Story, 'create', async (payload) => {
      createdStoryDoc = {
        _id: '507f1f77bcf86cd799439099',
        ...payload,
        createdAt: new Date(),
        views: [],
        reactions: [],
        populate: async () => createdStoryDoc,
        toObject: () => ({ _id: '507f1f77bcf86cd799439099', ...payload, createdAt: new Date() })
      };
      return createdStoryDoc;
    });

    const http = await createTestHttp(t);

    // User A attempts to submit author: userB._id in body (spoofing attempt)
    const res = await http.post('/api/stories', {
      mediaUrl: 'https://example.com/story_a.jpg',
      caption: 'My first story',
      author: userB._id,
      userId: userB._id
    }, {
      authorization: 'Bearer ' + tokenA
    });

    assert.equal(res.status, 201, 'POST /api/stories must return 201');
    assert.equal(createdStoryDoc.author.toString(), userA._id, 'Story owner must strictly be User A');
  });

  await t.test('GET /api/stories separates myStories and groups other authors', async () => {
    setupAuthMocks();
    const storyA = {
      _id: '507f1f77bcf86cd799439099',
      author: { _id: userA._id, username: 'user_a', displayName: 'User A', privacySettings: { isPrivate: false } },
      mediaUrl: 'https://example.com/story_a.jpg',
      caption: 'Story from A',
      views: [],
      reactions: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      toObject: function() { return { ...this }; }
    };

    mock.method(Story, 'find', () => ({
      populate: () => ({
        sort: async () => [storyA]
      })
    }));

    mock.method(Follow, 'find', () => ({ select: async () => [] }));
    mock.method(Block, 'find', async () => []);

    const http = await createTestHttp(t);

    // 1. User A fetches stories -> appears in myStories
    const resA = await http.get('/api/stories', {
      authorization: 'Bearer ' + tokenA
    });
    const dataA = await resA.json();
    assert.equal(dataA.myStories.length, 1, 'User A must see own story in myStories');
    assert.equal(dataA.storyGroups.length, 0, 'User A must not have own story in other storyGroups');

    // 2. User B fetches stories -> does NOT appear in myStories, appears in storyGroups
    const resB = await http.get('/api/stories', {
      authorization: 'Bearer ' + tokenB
    });
    const dataB = await resB.json();
    assert.equal(dataB.myStories.length, 0, 'User B must not see A story in myStories');
    assert.equal(dataB.storyGroups.length, 1, 'User B must see A in storyGroups');
    assert.equal(dataB.storyGroups[0].author.username, 'user_a');
  });

  await t.test('DELETE /api/stories/:id rejects unauthorized deletion by non-owner', async () => {
    setupAuthMocks();
    const storyA = {
      _id: '507f1f77bcf86cd799439099',
      author: userA._id,
      mediaUrl: 'https://example.com/story_a.jpg'
    };

    mock.method(Story, 'findById', async () => storyA);
    mock.method(Story, 'findByIdAndDelete', async () => storyA);

    const http = await createTestHttp(t);

    // User B attempts to delete User A's story
    const res = await http.delete('/api/stories/507f1f77bcf86cd799439099', {
      authorization: 'Bearer ' + tokenB
    });

    assert.equal(res.status, 403, 'User B deleting User A story must return 403 Forbidden');
  });

  await t.test('POST /api/stories/:id/view is idempotent', async () => {
    setupAuthMocks();
    const storyA = {
      _id: '507f1f77bcf86cd799439099',
      author: { _id: userA._id },
      views: [{ user: userB._id, viewedAt: new Date() }],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    let updateCount = 0;
    mock.method(Story, 'findById', () => ({
      populate: async () => storyA,
      select: async () => storyA
    }));
    mock.method(Story, 'updateOne', async () => {
      updateCount++;
    });

    const http = await createTestHttp(t);

    // User B records view when already viewed
    const res = await http.post('/api/stories/507f1f77bcf86cd799439099/view', {}, {
      authorization: 'Bearer ' + tokenB
    });

    assert.equal(res.status, 200);
    assert.equal(updateCount, 0, 'Duplicate view must not trigger database increment');
  });
});
