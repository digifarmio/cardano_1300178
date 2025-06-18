import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../hooks/useAuth';
import PageSpinner from './PageSpinner';
import { useLocation, Navigate, Outlet } from 'react-router';
import type { ProtectedRouteProps, DecodedToken } from '../lib/types';

const getDefaultRoute = (role: string): string => {
  const roleRoutes: Record<string, string> = {
    admin: '/admin',
    minter: '/admin',
    user: '/user',
  };
  return roleRoutes[role] ?? '/login';
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { token, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (isLoading) {
    return <PageSpinner />;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: pathname }} replace />;
  }

  try {
    const { role } = jwtDecode<DecodedToken>(token);

    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    if (pathname === '/') {
      const targetRoute = getDefaultRoute(role);
      return <Navigate to={targetRoute} replace />;
    }

    return <Outlet />;
  } catch (err) {
    console.error('Token validation failed:', err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
