import request from 'supertest';
import app from '../src/server';

describe('school-api integration sample', () => {
  it('health endpoint works', async () => {
    const r = await request(app).get('/health');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });
});

