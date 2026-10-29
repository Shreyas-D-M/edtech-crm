const request = require('supertest');
const app = require('../src/app');

describe('API Route & Security Integration Tests', () => {
  it('GET /api/health should return 200 with healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('POST /api/inquiries should reject empty payload with 400 and validation details', async () => {
    const res = await request(app)
      .post('/api/inquiries')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.details).toBeDefined();
    expect(res.body.details.name).toBeDefined();
  });

  it('GET /api/inquiries should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/inquiries');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('PATCH /api/inquiries/:id/status should reject unauthenticated requests with 401', async () => {
    const res = await request(app)
      .patch('/api/inquiries/some-random-uuid/status')
      .send({ status: 'Resolved' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/dashboard/stats should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login should reject empty credentials with 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/csrf-token should return a 200 and a 64-char hex CSRF token', async () => {
    const res = await request(app).get('/api/auth/csrf-token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.csrfToken).toHaveLength(64);
  });

  it('GET /non-existent-route should return 404', async () => {
    const res = await request(app).get('/api/unknown/endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
