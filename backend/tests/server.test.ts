import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('AptoHire Backend API Server', () => {
  it('returns healthy status on /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('serves public configuration parameters', async () => {
    const res = await request(app).get('/api/config/public');
    expect(res.status).toBe(200);
    expect(res.body.pass_mark).toBe(50);
    expect(res.body.video_max_mb).toBe(50);
    expect(res.body.video_max_seconds).toBe(190);
  });

  it('authenticates seed persona Aarav Sharma', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav@unia.edu.test' });
    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Aarav Sharma');
    expect(res.body.user.role).toBe('student');
    expect(res.body).toHaveProperty('token');
  });

  it('returns verified scores for Aarav Sharma', async () => {
    const res = await request(app).get('/api/student/user-aarav/scores');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((s: any) => s.skill_slug === 'react')).toBe(true);
  });

  it('provides machine-readable personal data export for FERPA compliance', async () => {
    const res = await request(app).get('/api/account/user-aarav/export');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('signed_url');
    expect(res.body.signed_url).toContain('data:application/json');
  });
});
