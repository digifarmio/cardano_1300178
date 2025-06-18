import { AxiosError } from 'axios';

interface ErrorResponse {
  error?: { message?: string };
  message?: string;
}

export function getErrorMessage(error: unknown): string {
  if (isAxiosError<ErrorResponse>(error)) {
    const errorData = error.response?.data;
    if (typeof errorData?.error?.message === 'string') {
      return errorData.error.message;
    }
    if (typeof errorData?.message === 'string') {
      return errorData.message;
    }
    if (typeof errorData?.error === 'string') {
      return errorData.error;
    }
    if (typeof error.message === 'string') {
      return error.message;
    }
    return 'An unknown Axios error occurred';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

function isAxiosError<T = unknown>(error: unknown): error is AxiosError<T> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
