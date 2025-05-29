import { Button, Flex, Result } from 'antd';
import { useNavigate } from 'react-router';

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/login');
  };

  return (
    <Flex className="items-center justify-center min-h-screen">
      <Result
        status="403"
        title="403"
        subTitle="Sorry, you are not authorized to access this page."
        extra={
          <Button type="primary" onClick={handleBackHome}>
            Back Home
          </Button>
        }
      />
    </Flex>
  );
};

export default Unauthorized;
