import express from 'express';
import request from 'supertest';
import { createTokenRoutes } from '@/modules/auth/token.routes';
import { JwtService } from '@/modules/core/jwt.service';
import { ConfigService } from '@/config/config.service';
import { Role } from '@/types';

describe('TokenController Integration (no mocks)', () => {
  let app: express.Express;
  let jwtService: JwtService;
  let adminToken: string;
  let userToken: string;

  beforeAll(() => {
    const configService = new ConfigService();
    jwtService = new JwtService(configService);

    // Generate admin and user tokens for Authorization header usage
    adminToken = jwtService.generate({ role: Role.admin });
    userToken = jwtService.generate({ role: Role.user, fields: ['field1'] });

    // Create express app with real middlewares & routes
    app = express();
    app.use(express.json());

    // Create routes using real TokenController with real TokenService
    app.use('/', createTokenRoutes());
  });

  describe('POST /tokens/admin', () => {
    it('should return 401 if no authorization header', async () => {
      const res = await request(app).post('/tokens/admin');
      expect(res.status).toBe(401);
    });

    it('should return 403 if user role is not admin', async () => {
      const res = await request(app)
        .post('/tokens/admin')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should issue admin token if user is admin', async () => {
      const res = await request(app)
        .post('/tokens/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(typeof res.body.token).toBe('string');

      // Verify returned token is valid and has admin role
      const payload = jwtService.verify(res.body.token);
      expect(payload.role).toBe(Role.admin);
    });
  });

  describe('POST /tokens/user', () => {
    it('should return 400 if fields is not an array of strings', async () => {
      const res = await request(app)
        .post('/tokens/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fields: 'invalid' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Fields must be an array of strings' });
    });

    it('should issue user token with provided fields', async () => {
      const fields = ['fieldA', 'fieldB'];
      const res = await request(app)
        .post('/tokens/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fields });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(typeof res.body.token).toBe('string');

      const payload = jwtService.verify(res.body.token);
      expect(payload.role).toBe(Role.user);
      expect(payload.fields).toEqual(fields);
    });

    it('should issue user token with empty fields if none provided', async () => {
      const res = await request(app)
        .post('/tokens/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fields: [] });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(typeof res.body.token).toBe('string');

      const payload = jwtService.verify(res.body.token);
      expect(payload.role).toBe(Role.user);
      expect(payload.fields).toEqual([]);
    });
  });
});
