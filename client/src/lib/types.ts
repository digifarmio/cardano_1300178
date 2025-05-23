import type { JwtPayload } from 'jwt-decode';

export interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DecodedToken extends JwtPayload {
  role?: string | string[];
  [key: string]: unknown;
}

export interface ProtectedRouteProps {
  allowedRoles: string[];
}

export interface FieldRecord {
  fieldId: string;
  size: number;
  sustainability: string | number;
  status: string;
}

export interface MintingReport {
  date: string;
  totalFields: number;
  minted: number;
  failed: number;
  csvUrl?: string;
}
