import { InfoCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Form, Input, Row, Space, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';

const { Title, Text } = Typography;

interface LoginFormValues {
  token: string;
}

const Login = () => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    try {
      login(values.token);
      navigate('/', { replace: true });
    } catch {
      form.setFields([
        {
          name: 'token',
          errors: ['Invalid access token. Please try again.'],
        },
      ]);
    }
  };

  return (
    <Row justify="center" align="middle" className="min-h-screen p-4">
      <Col xs={24} sm={20} md={16} lg={12} xl={10}>
        <Card
          className="w-full rounded-xl shadow-lg border-none"
          styles={{ body: { padding: '2rem', borderRadius: '12px' } }}
        >
          <Space direction="vertical" size="large" className="w-full text-center mb-8">
            <Space direction="vertical" size="middle" align="center" className="w-full">
              <Title level={2} className="!mb-0">
                <Text className="text-3xl">Digi</Text>
                <Text className="text-3xl text-green-600">Farm</Text>
                <Text className="text-3xl text-blue-600 ml-2 font-semibold">CARDANO</Text>
              </Title>
              <Text type="secondary" className="text-sm">
                Field Tokenization Platform
              </Text>
            </Space>
          </Space>

          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Flex vertical gap={32}>
              <Form.Item
                name="token"
                label={<Text className="text-sm font-medium">Access Token</Text>}
                rules={[{ required: true, message: 'Please enter a valid access token' }]}
                help={
                  <Space align="start" size="small" className="text-xs mt-2">
                    <InfoCircleOutlined className="mt-0.5" />
                    <Text type="secondary">
                      The token was provided to you for this demonstration
                    </Text>
                  </Space>
                }
              >
                <Input
                  placeholder="Enter your provided token"
                  autoComplete="off"
                  spellCheck="false"
                  autoFocus
                  className="py-3 px-4 rounded-lg"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="text-base font-semibold h-11"
                  icon={<LoginOutlined />}
                >
                  ACCESS DEMO
                </Button>
              </Form.Item>
            </Flex>
          </Form>

          <Space direction="vertical" size="small" className="w-full text-center mt-6">
            <Text type="secondary" className="text-xs">
              Need assistance? <a href="mailto:support@digifarm.io">Contact our support team</a>
            </Text>
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;
