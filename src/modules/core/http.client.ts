import { ConfigService } from '@/config/config.service';
import axios from 'axios';

export class HttpClient {
  protected readonly instance = axios.create({
    baseURL: new ConfigService().baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${new ConfigService().apiKey}`,
    },
  });
}
