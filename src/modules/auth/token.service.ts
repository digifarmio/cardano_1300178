import { ConfigService } from '@/config/config.service';
import { JwtService } from '@/modules/core/jwt.service';
import { Role } from '@/types';

export class TokenService {
  constructor(
    private readonly jwtService = new JwtService(),
    private readonly configService = new ConfigService()
  ) {}

  issueAdminToken(): string {
    return this.jwtService.generate({ role: Role.admin });
  }

  issueUserToken(fields: string[] = []): string {
    return this.jwtService.generate({ role: Role.user, fields });
  }
}
