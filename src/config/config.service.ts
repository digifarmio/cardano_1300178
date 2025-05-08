export class ConfigService {
  get apiKey(): string {
    return process.env.NMKR_API_KEY || '';
  }

  get baseUrl(): string {
    return process.env.NMKR_BASE_URL || 'https://api.nmkr.io/v2';
  }

  get batchSize(): number {
    return parseInt(process.env.BATCH_SIZE || '50', 10);
  }
}
