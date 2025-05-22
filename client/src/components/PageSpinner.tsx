import { Flex, Spin } from 'antd';

const PageSpinner = () => {
  return (
    <Flex justify="center" align="center" className="min-h-screen">
      <Spin size="large" tip="Loading..." />
    </Flex>
  );
};

export default PageSpinner;
