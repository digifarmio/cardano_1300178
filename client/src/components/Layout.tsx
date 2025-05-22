import { Button, Layout, Typography } from 'antd';
import { Outlet, useNavigate } from 'react-router';

import { useAuth } from '../hooks/useAuth';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout className="min-h-screen bg-neutral-100">
      <Header className="bg-white px-5 py-3 border-b border-neutral-200 shadow-sm flex items-center">
        <Title level={4} className="!mb-0 !text-lg !font-semibold flex items-center">
          Digi
          <span className="text-green-600 ml-1">Farm</span>
          <span className="text-[#0033ad] ml-1">CARDANO</span>
          <span className="bg-indigo-500 text-white text-[11px] uppercase font-semibold rounded px-2 py-[2px] ml-2">
            Admin
          </span>
        </Title>
        <div className="ml-auto">
          <Button danger onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Header>

      <Content className="p-6">
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AppLayout;
