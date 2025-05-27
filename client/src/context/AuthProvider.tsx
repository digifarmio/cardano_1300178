import { jwtDecode } from 'jwt-decode';
import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { tokenStorage } from '../lib/token-storage';
import { AuthContext } from './AuthContext';

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(tokenStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (token) {
      try {
        jwtDecode(token);
      } catch {
        tokenStorage.clearToken();
        setToken(null);
      }
    }
    setIsLoading(false);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  const login = useCallback((newToken: string) => {
    tokenStorage.setToken(newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearToken();
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
