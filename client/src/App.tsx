import { ConfigProvider } from 'antd';
import { RouterProvider } from 'react-router';

import { StyleProvider } from '@ant-design/cssinjs';

import AuthProvider from './context/AuthProvider';
import router from './router';
import themeConfig from './theme';

const App = () => {
  return (
    <StyleProvider layer>
      <ConfigProvider theme={themeConfig}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ConfigProvider>
    </StyleProvider>
  );
};

export default App;
