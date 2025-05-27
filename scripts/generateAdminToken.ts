import { TokenService } from '@/modules/auth/token.service';
import 'dotenv/config';

const tokenService = new TokenService();

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
