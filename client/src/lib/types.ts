export interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DecodedToken {
  role?: string | string[];
  [key: string]: unknown;
}

export interface ProtectedRouteProps {
  allowedRoles: string[];
}
