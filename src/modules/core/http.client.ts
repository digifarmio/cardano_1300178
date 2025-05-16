import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../../config/config.service';

export class HttpClient {
  protected readonly instance: AxiosInstance;
  private config = new ConfigService();

  constructor() {
    this.instance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 140000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
    });
  }
}
