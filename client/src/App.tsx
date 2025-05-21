import { Button, ConfigProvider, Space, theme, type ThemeConfig } from 'antd';

const config: ThemeConfig = {
  algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm],
  token: {
    // Seed Token
    colorPrimary: '#00b96b',

    // Alias Token
    colorBgContainer: '#f6ffed',
  },
};

const App = () => {
  return (
    <ConfigProvider theme={config}>
      <Space>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
      </Space>
    </ConfigProvider>
  );
};

export default App;
