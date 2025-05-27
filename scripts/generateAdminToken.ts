import { ConfigService } from '@/config/config.service';
import { TokenService } from '@/modules/auth/token.service';
import 'dotenv/config';

const configService = new ConfigService();
const tokenService = new TokenService(undefined, configService);

async function main() {
  try {
    const token = tokenService.issueAdminToken();
    console.log('Admin Access Token:\n', token);
  } catch (error) {
    console.error('Failed to generate token:', error);
    process.exit(1);
  }
}

main();
