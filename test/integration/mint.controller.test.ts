import { Server } from 'http';
import request from 'supertest';
import app from '@/api-handler';

process.env.NODE_ENV = 'test';

describe('MintController Integration Tests', () => {
  let server: Server;
  let latestReportId: string;

  // Provide valid JWT tokens for testing:
  // - ADMIN_JWT: token with admin role
  // - USER_JWT: token with user role and some field UIDs
  const ADMIN_JWT = process.env.TEST_ADMIN_JWT!;
  const USER_JWT = process.env.TEST_USER_JWT!;
  const authHeader = (jwt: string) => `Bearer ${jwt}`;

  beforeAll(async () => {
    server = app.listen(0);

    const reportsRes = await request(app)
      .get('/reports')
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body.success).toBe(true);

    const reports = reportsRes.body.data;
    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBeGreaterThan(0);

    const latestReport = reports.sort(
      (a: { created: string }, b: { created: string }) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
    )[0];

    expect(latestReport).toBeDefined();
    latestReportId = latestReport.id;
  });

  afterAll((done) => {
    server.close(() => {
      done();
    });
  });

  const waitForLatestReportToFinish = async (maxRetries = 3, intervalMs = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const res = await request(app).get('/reports').set('Authorization', authHeader(ADMIN_JWT));

      const reports = res.body.data;
      if (reports.length === 0) return;

      const latestReport = reports.sort(
        (a: { created: string | number | Date }, b: { created: string | number | Date }) =>
          new Date(b.created).getTime() - new Date(a.created).getTime()
      )[0];

      if (latestReport.status !== 'processing') return;

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error('Timeout: Latest report is still processing after waiting.');
  };

  // --- Protected Routes ---
  const adminRoutes = [
    { method: 'get', path: '/balance' },
    { method: 'get', path: '/counts' },
    { method: 'get', path: '/nfts/pending/10/1' },
    { method: 'get', path: '/nfts/some-uid' },
    { method: 'get', path: '/transactions' },
    { method: 'post', path: '/mintRandom' },
    { method: 'post', path: '/mintSpecific' },
    { method: 'post', path: '/reports' },
    { method: 'get', path: '/reports' },
    { method: 'get', path: '/reports/some-report-id' },
    { method: 'get', path: '/reports/some-report-id/download' },
    { method: 'delete', path: '/reports/some-report-id' },
  ];

  adminRoutes.forEach(({ method, path }) => {
    it(`should forbid user-role from accessing ${method.toUpperCase()} ${path}`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const agent = request(app) as unknown as Record<string, any>;
      const res = await agent[method](path).set('Authorization', authHeader(USER_JWT));
      expect(res.status).toBe(403);
    });
  });

  // --- Successful requests ---

  it('GET /balance (admin only) should return balance', async () => {
    const res = await request(app).get('/balance').set('Authorization', authHeader(ADMIN_JWT));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /counts (admin only) should return counts', async () => {
    const res = await request(app).get('/counts').set('Authorization', authHeader(ADMIN_JWT));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  const states = ['all', 'free', 'reserved', 'sold', 'error'] as const;
  states.forEach((state) => {
    it(`should return NFT collection for state: ${state}`, async () => {
      const res = await request(app)
        .get(`/nfts/${state}/10/1`)
        .set('Authorization', authHeader(ADMIN_JWT));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  it('GET /nfts/:uid (admin only) should return NFT details', async () => {
    // Step 1: Fetch NFTs with state "all", count 1, page 1
    const nftsRes = await request(app)
      .get('/nfts/all/10/1')
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(nftsRes.status).toBe(200);
    expect(nftsRes.body.success).toBe(true);
    expect(Array.isArray(nftsRes.body.data)).toBe(true);
    expect(nftsRes.body.data.length).toBeGreaterThan(0);

    // Step 2: Extract UID from the first NFT
    const validNftUid = nftsRes.body.data[0].uid;
    expect(validNftUid).toBeDefined();

    // Step 3: Use the UID to fetch the NFT details
    const res = await request(app)
      .get(`/nfts/${validNftUid}`)
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('GET /transactions (admin only) should return transactions', async () => {
    const res = await request(app).get('/transactions').set('Authorization', authHeader(ADMIN_JWT));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /mintRandom (admin only) should mint random NFTs', async () => {
    const res = await request(app)
      .post('/mintRandom')
      .set('Authorization', authHeader(ADMIN_JWT))
      .send({ count: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('POST /mintSpecific (admin only) should mint specific NFTs', async () => {
    // Step 1: Fetch a free NFT UID
    const getRes = await request(app)
      .get(`/nfts/free/10/1`)
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(Array.isArray(getRes.body.data)).toBe(true);
    expect(getRes.body.data.length).toBeGreaterThan(0);

    const freeNft = getRes.body.data[0];

    // Step 2: Mint it
    const mintRes = await request(app)
      .post('/mintSpecific')
      .set('Authorization', authHeader(ADMIN_JWT))
      .send({
        reserveNfts: [
          {
            nftUid: freeNft.uid,
            lovelace: 0,
            tokencount: 1,
          },
        ],
      });

    expect(mintRes.status).toBe(200);
    expect(mintRes.body.success).toBe(true);
    expect(mintRes.body.data).toBeDefined();
  });

  it('POST /reports (admin only) should generate a new report', async () => {
    await waitForLatestReportToFinish();

    const res = await request(app).post('/reports').set('Authorization', authHeader(ADMIN_JWT));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reportId).toBeDefined();
    expect(res.body.data.statusUrl).toBeDefined();
  });

  it('GET /reports (admin only) should return all reports', async () => {
    const res = await request(app).get('/reports').set('Authorization', authHeader(ADMIN_JWT));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /reports/:reportId (admin only) should return report status', async () => {
    // Step 1: Fetch all reports
    const reportsRes = await request(app)
      .get('/reports')
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(reportsRes.status).toBe(200);
    expect(reportsRes.body.success).toBe(true);
    const reports = reportsRes.body.data;
    expect(Array.isArray(reports)).toBe(true);
    expect(reports.length).toBeGreaterThan(0);

    // Step 2: Pick the latest report (by created timestamp if available)
    const latestReport = reports.sort(
      (a: { created: string | number | Date }, b: { created: string | number | Date }) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
    )[0];

    expect(latestReport).toBeDefined();
    const reportId = latestReport.id;

    // Step 3: Fetch its status
    const statusRes = await request(app)
      .get(`/reports/${reportId}`)
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data).toBeDefined();
  });

  it('GET /reports/:reportId should return report status', async () => {
    const res = await request(app)
      .get(`/reports/${latestReportId}`)
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
  });

  it('DELETE /reports/:reportId should delete the report', async () => {
    const res = await request(app)
      .delete(`/reports/${latestReportId}`)
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deleted).toBe(true);
  });

  it('GET /user/nfts (authenticated user) should return user NFTs', async () => {
    const res = await request(app).get('/user/nfts').set('Authorization', authHeader(USER_JWT));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // --- ERROR HANDLING TESTS ---

  it('GET /balance with invalid token should return 401', async () => {
    const res = await request(app).get('/balance').set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('GET /balance with non-admin user token should return 403', async () => {
    const res = await request(app).get('/balance').set('Authorization', authHeader(USER_JWT));
    expect(res.status).toBe(403);
  });

  it('GET /nfts with incomplete path should return 404', async () => {
    const res = await request(app)
      .get('/nfts/active/10') // missing page param - should not match any route
      .set('Authorization', authHeader(ADMIN_JWT));
    expect(res.status).toBe(404);
  });

  it('GET /nfts/:uid with unknown UID should return 404', async () => {
    const res = await request(app)
      .get('/nfts/unknown-nft-uid')
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(res.status).toBe(404);
  });

  it('POST /mintRandom with invalid body (missing count) should return 400', async () => {
    const res = await request(app)
      .post('/mintRandom')
      .set('Authorization', authHeader(ADMIN_JWT))
      .send({ count: 0 });
    expect(res.status).toBe(400);
  });

  it('POST /mintSpecific with invalid payload should return 400', async () => {
    const res = await request(app)
      .post('/mintSpecific')
      .set('Authorization', authHeader(ADMIN_JWT))
      .send({ reserveNfts: {} });
    expect(res.status).toBe(400);
  });

  it('DELETE /reports/:reportId with unknown reportId should return 200', async () => {
    const res = await request(app)
      .delete('/reports/nonexistent-report-id')
      .set('Authorization', authHeader(ADMIN_JWT));
    expect(res.status).toBe(200);
  });

  it('GET /reports/:reportId/download with unknown reportId should return 404', async () => {
    const res = await request(app)
      .get('/reports/non-existing-id/download')
      .set('Authorization', authHeader(ADMIN_JWT));

    expect(res.status).toBe(404);
  });

  it('GET /user/nfts without token should return 401', async () => {
    const res = await request(app).get('/user/nfts');
    expect(res.status).toBe(401);
  });
});
