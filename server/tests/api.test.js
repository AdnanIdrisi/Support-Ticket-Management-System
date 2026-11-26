const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';

const app = require('../src/app');
const User = require('../src/models/User');
const Ticket = require('../src/models/Ticket');
const ActivityLog = require('../src/models/ActivityLog');
const Notification = require('../src/models/Notification');

let mongoServer;
let userToken;
let otherUserToken;
let adminToken;
let userId;
let adminId;
let createdTicketId;

const waitForEvents = () => new Promise((resolve) => setTimeout(resolve, 80));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}, 600000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

describe('Support Ticket Management API (/api/v1)', () => {
  describe('Health Check', () => {
    it('GET /api/v1/health should return 200', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Authentication & RBAC', () => {
    it('should register a new user with role "user"', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Alice Support',
        email: 'alice@example.com',
        password: 'Password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.token).toBeDefined();
      userToken = res.body.data.token;
      userId = res.body.data.user._id;
    });

    it('should reject duplicate email registration with 409', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'Alice Duplicate',
        email: 'alice@example.com',
        password: 'Password123',
      });
      expect(res.status).toBe(409);
    });

    it('should validate registration payload and return 400 on invalid input', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        name: 'A',
        email: 'not-an-email',
        password: '123',
      });
      expect(res.status).toBe(400);
      expect(res.body.details).toBeDefined();
    });

    it('should register a second user and create an admin user in DB', async () => {
      const otherRes = await request(app).post('/api/v1/auth/register').send({
        name: 'Bob User',
        email: 'bob@example.com',
        password: 'Password123',
      });
      otherUserToken = otherRes.body.data.token;

      const adminUser = await User.create({
        name: 'Admin One',
        email: 'admin@example.com',
        password: 'AdminPassword123',
        role: 'admin',
      });
      adminId = adminUser._id.toString();

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@example.com',
        password: 'AdminPassword123',
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.role).toBe('admin');
      adminToken = loginRes.body.data.token;
    });

    it('should reject unauthenticated requests to /auth/me with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return current user on /auth/me with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('alice@example.com');
    });
  });

  describe('Ticket Management & Event-Driven Activity', () => {
    it('should allow user to create a support ticket and trigger ticket.created event', async () => {
      const res = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Cannot export PDF invoices',
          description: 'Clicking export PDF on the billing page returns a 500 error.',
          category: 'bug',
          priority: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.ticket.ticketNumber).toMatch(/^TKT-/);
      expect(res.body.data.ticket.status).toBe('open');
      createdTicketId = res.body.data.ticket._id;

      await waitForEvents();

      const logs = await ActivityLog.find({ ticket: createdTicketId });
      expect(logs.some((l) => l.event === 'ticket.created')).toBe(true);

      const adminNotifs = await Notification.find({ recipient: adminId });
      expect(adminNotifs.length).toBeGreaterThanOrEqual(1);
    });

    it('should scope GET /tickets to only the logged-in user tickets', async () => {
      const aliceRes = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${userToken}`);
      expect(aliceRes.status).toBe(200);
      expect(aliceRes.body.data.tickets.length).toBe(1);

      const bobRes = await request(app)
        .get('/api/v1/tickets')
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(bobRes.status).toBe(200);
      expect(bobRes.body.data.tickets.length).toBe(0);
    });

    it('should prevent another user from viewing or editing someone else ticket (403)', async () => {
      const getRes = await request(app)
        .get(`/api/v1/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(getRes.status).toBe(403);

      const patchRes = await request(app)
        .patch(`/api/v1/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Hacked title' });
      expect(patchRes.status).toBe(403);
    });

    it('should allow ticket owner to update their open ticket and log ticket.updated', async () => {
      const res = await request(app)
        .patch(`/api/v1/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ priority: 'urgent' });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.priority).toBe('urgent');

      await waitForEvents();
      const logs = await ActivityLog.find({
        ticket: createdTicketId,
        event: 'ticket.updated',
      });
      expect(logs.length).toBe(1);
    });
  });

  describe('Comments', () => {
    it('should allow ticket owner to add a comment', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ body: 'Happens in Chrome 130 on Windows.' });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.body).toContain('Chrome 130');
    });

    it('should prevent other users from commenting on another user ticket', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ body: 'Unauthorized comment' });
      expect(res.status).toBe(403);
    });

    it('should allow admin to reply to any ticket and notify owner', async () => {
      const res = await request(app)
        .post(`/api/v1/tickets/${createdTicketId}/comments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ body: 'We identified the issue and are deploying a fix.' });

      expect(res.status).toBe(201);
      await waitForEvents();

      const ownerNotifs = await Notification.find({
        recipient: userId,
        event: 'comment.added',
      });
      expect(ownerNotifs.length).toBe(1);
    });
  });

  describe('Admin Management, Filtering, Pagination & Stats', () => {
    it('should forbid regular users from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin to update ticket status to resolved and trigger events', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved', assignedTo: adminId });

      expect(res.status).toBe(200);
      expect(res.body.data.ticket.status).toBe('resolved');
      expect(res.body.data.ticket.resolvedAt).toBeTruthy();

      await waitForEvents();
      const logs = await ActivityLog.find({ ticket: createdTicketId });
      const eventTypes = logs.map((l) => l.event);
      expect(eventTypes).toContain('ticket.status_changed');
      expect(eventTypes).toContain('ticket.resolved');
    });

    it('should support search, filtering, and pagination on admin tickets', async () => {
      const res = await request(app)
        .get('/api/v1/admin/tickets?status=resolved&priority=urgent&search=PDF&page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tickets.length).toBe(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should return dashboard statistics for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalTickets).toBe(1);
      expect(res.body.data.byStatus.resolved).toBe(1);
      expect(res.body.data.recentActivity.length).toBeGreaterThan(0);
    });
  });

  describe('Notifications & Ticket Deletion', () => {
    it('should allow user to fetch and mark notifications as read', async () => {
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${userToken}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.data.unreadCount).toBeGreaterThanOrEqual(2);

      const readRes = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${userToken}`);
      expect(readRes.status).toBe(200);
    });

    it('should allow user to delete their own open ticket', async () => {
      const createRes = await request(app)
        .post('/api/v1/tickets')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Temporary ticket to delete',
          description: 'Testing ticket deletion flow for open tickets.',
        });

      const tempId = createRes.body.data.ticket._id;
      const delRes = await request(app)
        .delete(`/api/v1/tickets/${tempId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(delRes.status).toBe(200);
      const found = await Ticket.findById(tempId);
      expect(found).toBeNull();
    });
  });
});
