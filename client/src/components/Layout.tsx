import { Button, Layout, Typography } from 'antd';
import { jwtDecode } from 'jwt-decode';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import type { DecodedToken } from '../lib/types';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppLayout = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { role } = (token ? (jwtDecode(token) as DecodedToken) : {}) as DecodedToken;

  return (
    <Layout className="min-h-screen bg-neutral-100">
      <Header className="bg-white px-5 py-3 border-b border-neutral-200 shadow-sm flex items-center sticky top-0 z-10">
        <NavLink to="/" className="flex items-center">
          <Title level={4} className="!mb-0 !text-lg !font-semibold flex items-center">
            Digi
            <span className="text-green-600">Farm</span>
            <span className="text-blue-600 ml-1">CARDANO</span>
            {role && (
              <span className="bg-indigo-500 text-white text-[11px] uppercase font-semibold rounded px-2 py-[2px] ml-2">
                {role}
              </span>
            )}
          </Title>
        </NavLink>
        <div className="ml-auto">
          <Button danger onClick={handleLogout} icon={<LogoutOutlined />}>
            Logout
          </Button>
        </div>
      </Header>

      <Content className="p-6 w-full md:w-3/4 lg:w-2/3 mx-auto">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AppLayout;
