import { jwtDecode } from 'jwt-decode';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../hooks/useAuth';
import PageSpinner from './PageSpinner';

import type { DecodedToken, ProtectedRouteProps } from '../lib/types';

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

    if (typeof role !== 'string' || !allowedRoles.includes(role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    if (pathname === '/') {
      return <Navigate to={role === 'admin' ? '/admin' : '/user'} replace />;
    }

    return <Outlet />;
  } catch (err) {
    console.error('Token decoding failed:', err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
