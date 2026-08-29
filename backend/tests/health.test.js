const request = require('supertest');
const app = require('../app');

describe('Health Check API', () => {
  it('should return 200 and API status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
  });
});
