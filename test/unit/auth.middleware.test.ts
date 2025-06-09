import jwt from 'jsonwebtoken';
import { JwtService } from '@/modules/core/jwt.service';
import { ConfigService } from '@/config/config.service';
import { Role, TokenPayload } from '@/types';

jest.useFakeTimers();

describe('JwtService (no method mocking)', () => {
  let jwtService: JwtService;
  let mockConfigService: ConfigService;

  const mockSecret = 'test-secret';
  const mockIssuer = 'test-issuer';
  const mockExpiresIn = '1h'; // 1 hour

  const payload: TokenPayload = {
    role: Role.admin,
    fields: ['f1', 'f2'],
  };

  beforeEach(() => {
    mockConfigService = {
      jwtSecret: mockSecret,
      jwtIssuer: mockIssuer,
      jwtExpiresIn: mockExpiresIn,
    } as ConfigService;

    jwtService = new JwtService(mockConfigService);
  });

  it('should generate a valid JWT token', () => {
    const token = jwtService.generate(payload);

    expect(typeof token).toBe('string');
    const decoded = jwt.verify(token, mockSecret, {
      issuer: mockIssuer,
      algorithms: ['HS256'],
    }) as TokenPayload;

    expect(decoded.role).toBe('admin');
    expect(decoded.fields).toEqual(['f1', 'f2']);
  });

  it('should verify a valid token and return the payload', () => {
    const token = jwtService.generate(payload);
    const result = jwtService.verify(token);

    expect(result).toMatchObject(payload);
  });

  it('should throw if token has invalid signature', () => {
    const token = jwt.sign(payload, 'wrong-secret', {
      issuer: mockIssuer,
      algorithm: 'HS256',
    });

    expect(() => jwtService.verify(token)).toThrow('invalid signature');
  });

  it('should throw if token has wrong issuer', () => {
    const token = jwt.sign(payload, mockSecret, {
      issuer: 'wrong-issuer',
      algorithm: 'HS256',
    });

    expect(() => jwtService.verify(token)).toThrow('jwt issuer invalid. expected: test-issuer');
  });

  it('should throw if token is expired', () => {
    const expiredConfig = {
      jwtSecret: mockSecret,
      jwtIssuer: mockIssuer,
      jwtExpiresIn: '1ms', // 1 millisecond
    } as ConfigService;

    const shortLivedService = new JwtService(expiredConfig);
    const token = shortLivedService.generate(payload);

    // Advance fake timer to simulate expiry
    jest.advanceTimersByTime(1000);

    expect(() => shortLivedService.verify(token)).toThrow(/jwt expired/);
  });
});
