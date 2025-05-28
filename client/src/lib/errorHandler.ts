import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: { message?: string };
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<ErrorResponse>(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unknown Axios error occurred'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

function isAxiosError<T = unknown>(error: unknown): error is AxiosError<T> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
