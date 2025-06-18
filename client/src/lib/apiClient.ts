import axios, { AxiosError } from 'axios';
import { tokenStorage } from './token-storage';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const isAuthRoute = error.config?.url?.includes('/login');
    const requestUrl = error.config?.url;
    const baseUrl = error.config?.baseURL;

    const isOwnApiRequest =
      !requestUrl?.startsWith('http') && (baseUrl === API_BASE_URL || !baseUrl);

    const responseData = error.response?.data as {
      message?: string;
      error?: {
        code?: string;
        message?: string;
        details?: unknown;
      };
    };

    // Check if this is an external API error (like NMKR)
    const isExternalApiError = responseData?.error?.code === 'API_ERROR';
    // Check if this is a legitimate auth error from our API
    const errorMessage = responseData?.message?.toLowerCase() || '';
    const nestedErrorMessage = responseData?.error?.message?.toLowerCase() || '';

    const isOurAuthError =
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('token') ||
      errorMessage.includes('invalid token') ||
      errorMessage.includes('invalid signature') ||
      nestedErrorMessage.includes('unauthorized') ||
      nestedErrorMessage.includes('token') ||
      nestedErrorMessage.includes('invalid token') ||
      nestedErrorMessage.includes('invalid signature');

    console.log('API Error:', {
      status: error.response?.status,
      url: requestUrl,
      baseUrl: baseUrl,
      isOwnApi: isOwnApiRequest,
      isExternalApiError: isExternalApiError,
      isOurAuthError: isOurAuthError,
      errorCode: responseData?.error?.code,
      message:
        responseData?.message ||
        responseData?.error?.message ||
        responseData?.error ||
        error.message,
    });

    // Only redirect to login if:
    // 1. It's a 401 error OR (500 error with auth-related message)
    // 2. It's not the login route itself
    // 3. It's from our own API (not external)
    // 4. It's NOT an external API error (API_ERROR code)
    // 5. It appears to be an actual auth error from our API OR has no specific message
    const isAuthStatusCode =
      error.response?.status === 401 || (error.response?.status === 500 && isOurAuthError);

    if (
      isAuthStatusCode &&
      !isAuthRoute &&
      isOwnApiRequest &&
      !isExternalApiError &&
      (isOurAuthError || (!responseData?.message && !responseData?.error?.message))
    ) {
      console.log('Authentication failed - redirecting to login');
      tokenStorage.clearToken();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
