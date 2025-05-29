import axios from 'axios';
import { ConfigService } from '@/config/config.service';

export class HttpClient {
  protected readonly instance = axios.create({
    baseURL: new ConfigService().baseUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${new ConfigService().apiKey}`,
    },
  });
}
