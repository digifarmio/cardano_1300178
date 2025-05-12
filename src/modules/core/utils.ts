import { AxiosError } from 'axios';
import { NMKRAPIError } from './errors';

export function handleAxiosError(error: unknown): never {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message;
    throw new NMKRAPIError(message, error.response?.status, error.response?.data);
  }

  if (error instanceof Error) {
    throw new NMKRAPIError(error.message);
  }

  throw new NMKRAPIError('Unknown error occurred');
}
