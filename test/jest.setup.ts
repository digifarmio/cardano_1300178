import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Force NODE_ENV to 'test' unconditionally
process.env.NODE_ENV = 'test';

// Always load .env.test file
const testEnvPath = path.resolve(process.cwd(), '.env.test');
console.log('Jest setup: Forcing NODE_ENV=test and loading .env.test');

if (fs.existsSync(testEnvPath)) {
  const result = dotenv.config({ path: testEnvPath });
  if (result.error) {
    console.error('Jest setup: Error loading .env.test:', result.error);
  } else {
    console.log('Jest setup: Successfully loaded .env.test');
  }
} else {
  console.warn('Jest setup: .env.test file not found at:', testEnvPath);
}

// Debug: Log key environment variables after load
console.log('Jest setup complete:', {
  NODE_ENV: process.env.NODE_ENV,
  MAX_MINT_LIMIT: process.env.MAX_MINT_LIMIT,
});
