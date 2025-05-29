import jwt, { JwtPayload } from 'jsonwebtoken';
import { ConfigService } from '@/config/config.service';
import { TokenPayload } from '@/types';

export class JwtService {
  constructor(private readonly configService = new ConfigService()) {}

  generate(payload: JwtPayload): string {
    const secretKey = this.configService.jwtSecret;
    const options: jwt.SignOptions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expiresIn: this.configService.jwtExpiresIn as any,
      issuer: this.configService.jwtIssuer,
      algorithm: 'HS256',
    };

    return jwt.sign(payload, secretKey, options);
  }

  verify(token: string): TokenPayload {
    const secretKey = this.configService.jwtSecret;
    const options: jwt.VerifyOptions = {
      issuer: this.configService.jwtIssuer,
      algorithms: ['HS256'],
    };

    return jwt.verify(token, secretKey, options) as TokenPayload;
  }
}
