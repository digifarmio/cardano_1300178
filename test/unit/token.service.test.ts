import { TokenService } from '@/modules/auth/token.service';
import { JwtService } from '@/modules/core/jwt.service';
import { ConfigService } from '@/config/config.service';
import { Role } from '@/types';

describe('TokenService (integration)', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    const configService = new ConfigService();
    const jwtService = new JwtService(configService);
    tokenService = new TokenService(jwtService, configService);
  });

  describe('issueAdminToken', () => {
    it('should generate a valid JWT with admin role', () => {
      const token = tokenService.issueAdminToken();
      expect(typeof token).toBe('string');

      const payload = tokenService['jwtService'].verify(token);
      expect(payload).toMatchObject({ role: Role.admin });
    });
  });

  describe('issueMinterToken', () => {
    it('should generate a valid JWT with minter role', () => {
      const token = tokenService.issueMinterToken();
      expect(typeof token).toBe('string');

      const payload = tokenService['jwtService'].verify(token);
      expect(payload).toMatchObject({ role: Role.minter });
    });
  });

  describe('issueUserToken', () => {
    it('should generate a valid JWT with user role and specified fields', () => {
      const fields = ['field1', 'field2'];
      const token = tokenService.issueUserToken(fields);
      expect(typeof token).toBe('string');

      const payload = tokenService['jwtService'].verify(token);
      expect(payload).toMatchObject({ role: Role.user, fields });
    });

    it('should generate a valid JWT with user role and empty fields if none provided', () => {
      const token = tokenService.issueUserToken();
      expect(typeof token).toBe('string');

      const payload = tokenService['jwtService'].verify(token);
      expect(payload).toMatchObject({ role: Role.user, fields: [] });
    });
  });
});
