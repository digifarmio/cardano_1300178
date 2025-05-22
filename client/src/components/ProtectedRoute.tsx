import { jwtDecode } from 'jwt-decode';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth';

import type { DecodedToken, ProtectedRouteProps } from '../lib/types';
import PageSpinner from './PageSpinner';

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
    const roles = role ? (Array.isArray(role) ? role : [role]) : [];
    const validRoles = roles.filter((r): r is string => typeof r === 'string');
    const hasAccess = validRoles.some((r) => allowedRoles.includes(r));

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }

    if (pathname === '/') {
      if (validRoles.includes('admin')) {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/user" replace />;
    }

    return <Outlet />;
  } catch (err) {
    console.error('Token decoding failed:', err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
