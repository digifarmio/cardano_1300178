import ErrorBoundary from 'antd/es/alert/ErrorBoundary';
import { createBrowserRouter } from 'react-router';

import AppLayout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import UserDashboard from './pages/UserDashboard';

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <ProtectedRoute allowedRoles={['admin', 'minter', 'user']} />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'unauthorized',
        element: <Unauthorized />,
      },
      {
        element: <AppLayout />,
        children: [
          {
            path: 'admin',
            element: <ProtectedRoute allowedRoles={['admin', 'minter']} />,
            children: [{ index: true, element: <AdminDashboard /> }],
          },
          {
            path: 'user',
            element: <ProtectedRoute allowedRoles={['user']} />,
            children: [{ index: true, element: <UserDashboard /> }],
          },
        ],
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;
