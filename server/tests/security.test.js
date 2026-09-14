import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { once } from 'node:events';
import { createServer } from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { Server } from 'socket.io';
import { io as connect } from 'socket.io-client';
import app from '../app.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import Session from '../models/Session.js';
import Post from '../models/Post.js';
import redis from '../config/redis.js';
import { checkOTP } from '../services/otpService.js';
import { authenticateAccessToken, readRefreshCookie } from '../services/sessionService.js';
import { analyzeText } from '../services/detectionService.js';
import { processQueueItem } from '../workers/moderationWorker.js';
import generateToken from '../utils/generateToken.js';
import { initializeSockets } from '../socket/socketHandler.js';
import { matchesMediaType } from '../utils/mediaSignature.js';
import { jwtSecret } from '../config/security.js';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters-long';
process.env.FRONTEND_URL = 'http://localhost:3000';
afterEach(() => mock.restoreAll());
const user = { _id: '507f1f77bcf86cd799439011', username: 'alice', email: 'alice@example.test',
  emailVerified: true, isBanned: false, role: 'user' };
const sid = '507f1f77bcf86cd799439012';
const query = value => ({ select: async () => value, then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) });
function sessionMocks(overrides = {}) {
  mock.method(User, 'findById', () => query({ ...user, ...overrides }));
  mock.method(Session, 'findOne', async () => ({ _id: sid, user: user._id }));
}
async function http(t) {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = 'http://127.0.0.1:' + server.address().port;
  return (path, body, headers = {}) => fetch(base + path, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body)
  });
}
const otpHash = await bcrypt.hash('123456', 4);
const record = { _id: '507f1f77bcf86cd799439014', email: 'new@example.test', type: 'register',
  otpHash, expiresAt: new Date(Date.now() + 60000),
  tempUserData: { username: 'alice', displayName: 'Alice', passwordHash: 'unused' } };

 test('registration collision never grants a token for the existing account', async t => {
  mock.method(OTP, 'findOneAndUpdate', async () => record);
  mock.method(OTP, 'findOneAndDelete', async () => record);
  mock.method(User, 'findOne', async () => user);
  const create = mock.method(Session, 'create', async () => { throw new Error('Must not issue session'); });
  const post = await http(t);
  const response = await post('/api/auth/verify-otp', { email: record.email, otp: '123456' });
  assert.equal(response.status, 409);
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(create.mock.callCount(), 0);
});

test('OTP requests explicitly constrain expiry and attempts', async () => {
  mock.method(OTP, 'findOneAndUpdate', async filter => {
    assert.ok(filter.expiresAt.$gt instanceof Date);
    assert.equal(filter.$or[0].failedAttempts.$lt, 5);
    return null;
  });
  assert.equal(await checkOTP(record.email, 'register', '123456', true), null);
});

test('a wrong OTP does not consume the request', async () => {
  mock.method(OTP, 'findOneAndUpdate', async () => record);
  const consume = mock.method(OTP, 'findOneAndDelete', async () => record);
  assert.equal(await checkOTP(record.email, 'register', '000000', true), null);
  assert.equal(consume.mock.callCount(), 0);
});

test('an OTP can only be consumed once, even with concurrent verifications', async () => {
  mock.method(OTP, 'findOneAndUpdate', async () => record);
  let consumed = false;
  mock.method(OTP, 'findOneAndDelete', async () => {
    if (consumed) return null;
    consumed = true; return record;
  });
  const results = await Promise.all([1, 2].map(() => checkOTP(record.email, 'register', '123456', true)));
  assert.equal(results.filter(Boolean).length, 1);
});

test('invalid action types and malformed OTPs cannot reach the database', async () => {
  const find = mock.method(OTP, 'findOneAndUpdate', async () => record);
  assert.equal(await checkOTP(record.email, 'email_change', '123456'), null);
  assert.equal(await checkOTP(record.email, 'register', '12345'), null);
  assert.equal(find.mock.callCount(), 0);
});

test('untrusted origins cannot rotate or clear sessions', async t => {
  const post = await http(t);
  for (const path of ['/api/auth/refresh', '/api/auth/logout', '/api/auth/login']) {
    const response = await post(path, {}, { origin: 'https://untrusted.example' });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
});

test('refresh tokens rotate once while preserving the session ID', async t => {
  let consumed = false;
  mock.method(Session, 'findOneAndUpdate', async filter => {
    assert.ok(filter.expiresAt.$gt instanceof Date);
    assert.equal(filter.revokedAt, null);
    if (consumed) return null;
    consumed = true; return { _id: sid, user: user._id };
  });
  mock.method(User, 'findById', () => query(user));
  const create = mock.method(Session, 'create', async data => {
    assert.equal(data.tokenHash.length, 64);
    return { ...data, _id: sid };
  });
  const post = await http(t);
  const responses = await Promise.all([1, 2].map(() => post('/api/auth/refresh', {}, {
    origin: 'http://localhost:3000', cookie: 'refreshToken=' + 'a'.repeat(96)
  })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 401]);
  assert.equal(create.mock.callCount(), 0);
  const token = (await responses.find(r => r.status === 200).clone().json()).token;
  assert.equal(jwt.decode(token).sid, sid);
  const success = responses.find(r => r.status === 200);
  assert.match(success.headers.get('set-cookie'), /HttpOnly/);
  assert.match(success.headers.get('set-cookie'), /Path=\/api\/auth/);
});

test('banned users cannot use an otherwise valid access token', async () => {
  sessionMocks({ isBanned: true });
  await assert.rejects(authenticateAccessToken(generateToken(user, sid)), /no longer active/);
});

test('revoked sessions cannot use a valid access token', async () => {
  mock.method(User, 'findById', () => query(user));
  mock.method(Session, 'findOne', async () => null);
  await assert.rejects(authenticateAccessToken(generateToken(user, sid)), /no longer active/);
});

test('expired access tokens are rejected', async () => {
  const expired = jwt.sign({ id: user._id, sid }, process.env.JWT_SECRET, {
    expiresIn: -1, issuer: 'humanhub', audience: 'humanhub-client'
  });
  await assert.rejects(authenticateAccessToken(expired), /expired/);
});

test('logout revokes the bearer session and expires the cookie', async t => {
  const update = mock.method(Session, 'updateMany', async () => ({}));
  const post = await http(t);
  const response = await post('/api/auth/logout', {}, { authorization: 'Bearer ' + generateToken(user, sid) });
  assert.equal(response.status, 200);
  assert.equal(update.mock.calls[0].arguments[0]._id, sid);
  assert.match(response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
});

test('sockets require authentication and ignore user-selected channel identities', async t => {
  sessionMocks();
  const server = createServer();
  const io = new Server(server);
  initializeSockets(io);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const endpoint = 'http://127.0.0.1:' + server.address().port;
  const bad = connect(endpoint, { transports: ['websocket'], reconnection: false });
  const good = connect(endpoint, { transports: ['websocket'], reconnection: false, auth: { token: generateToken(user, sid) } });
  t.after(() => { bad.disconnect(); good.disconnect(); return new Promise(resolve => io.close(resolve)); });
  const failure = once(bad, 'connect_error');
  await once(good, 'connect');
  assert.equal((await failure)[0].message, 'Authentication required');
  good.emit('join_user_channel', 'victim');
  const socket = io.sockets.sockets.get(good.id);
  socket.on('probe', ack => ack([...socket.rooms]));
  await good.emitWithAck('probe');
  assert.ok(socket.rooms.has('user_' + user._id));
  assert.ok(!socket.rooms.has('user_victim'));
  const receive = once(good, 'message:receive');
  io.to('user_' + user._id).emit('message:receive', { body: 'Private message' });
  assert.equal((await receive)[0].body, 'Private message');
});

test('detector failures never become synthetic approval scores', async () => {
  mock.method(axios, 'post', async () => { throw new Error('unavailable'); });
  await assert.rejects(analyzeText('An ordinary post'), /unavailable/);
});

test('random or legacy detector responses without model provenance are rejected', async () => {
  mock.method(axios, 'post', async () => ({ data: { score: 0.1, confidence: 0.9 } }));
  await assert.rejects(analyzeText('An ordinary post'), /no valid model result/);
});

test('detector outage leaves a queued post pending for manual review', async () => {
  const postId = '507f1f77bcf86cd799439015';
  mock.method(redis, 'rpop', async () => JSON.stringify({ postId }));
  mock.method(Post, 'findOne', async () => ({ _id: postId, body: 'Hello', mediaUrls: [], author: user._id }));
  mock.method(axios, 'post', async () => { throw new Error('unavailable'); });
  const update = mock.method(Post, 'updateOne', async () => ({}));
  const publish = mock.method(Post, 'findOneAndUpdate', async () => { throw new Error('Must not publish'); });
  await processQueueItem();
  assert.equal(publish.mock.callCount(), 0);
  assert.equal(update.mock.calls[0].arguments[0].status, 'pending_review');
  assert.match(update.mock.calls[0].arguments[1].$set.moderationError, /moderator review/);
});

test('new posts default to review and legacy rejected status is invalid', () => {
  const post = new Post({ author: user._id, body: 'Hello' });
  assert.equal(post.status, 'pending_review');
  post.status = 'rejected';
  assert.ok(post.validateSync().errors.status);
});

test('upload validation rejects HTML disguised as an image and unsupported SVG', () => {
  assert.equal(matchesMediaType(Buffer.from('<html>not a photo</html>'), 'image/png'), false);
  assert.equal(matchesMediaType(Buffer.from('<svg></svg>'), 'image/svg+xml'), false);
  assert.equal(matchesMediaType(Buffer.from('89504e470d0a1a0a00000000', 'hex'), 'image/png'), true);
});

test('malformed refresh cookies do not throw', () => {
  assert.equal(readRefreshCookie({ headers: { cookie: 'refreshToken=%ZZ' } }), null);
});

test('missing signing secret fails instead of using a public fallback', () => {
  const saved = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  try { assert.throws(jwtSecret, /Set JWT_SECRET/); }
  finally { process.env.JWT_SECRET = saved; }
});

test('post creation saves pending content and enqueues its ID', async t => {
  sessionMocks();
  let created;
  mock.method(Post, 'create', async data => { created = new Post(data); return created; });
  mock.method(Post, 'findById', () => ({
    populate() { return this; }, then(resolve) { resolve(created); }
  }));
  mock.method(User, 'findByIdAndUpdate', async () => user);
  const enqueue = mock.method(redis, 'lpush', async () => 1);
  const post = await http(t);
  const response = await post('/api/posts', { caption: 'Review this post' }, {
    authorization: 'Bearer ' + generateToken(user, sid)
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.post.status, 'pending_review');
  assert.equal(enqueue.mock.calls[0].arguments[0], 'moderation:queue');
  assert.equal(JSON.parse(enqueue.mock.calls[0].arguments[1]).postId, String(created._id));
});

test('a queue outage preserves the submitted post for manual review', async t => {
  sessionMocks();
  let created;
  mock.method(Post, 'create', async data => { created = new Post(data); return created; });
  mock.method(Post, 'findById', () => ({ populate() { return this; }, then(resolve) { resolve(created); } }));
  mock.method(Post.prototype, 'save', async function () { return this; });
  mock.method(User, 'findByIdAndUpdate', async () => user);
  mock.method(redis, 'lpush', async () => { throw new Error('Redis unavailable'); });
  const post = await http(t);
  const response = await post('/api/posts', { caption: 'Keep this pending' }, {
    authorization: 'Bearer ' + generateToken(user, sid)
  });
  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.post.status, 'pending_review');
  assert.match(body.post.moderationError, /moderator review/);
});
