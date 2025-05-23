import { Button, Flex, Result } from 'antd';
import { useNavigate } from 'react-router';

const ErrorBoundary = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate(0);
  };

  return (
    <Flex justify="center" align="center" className="min-h-screen">
      <Result
        status="500"
        title="500"
        subTitle="Sorry, something went wrong."
        extra={
          <Button type="primary" onClick={handleRetry}>
            Retry
          </Button>
        }
      />
    </Flex>
  );
};

export default ErrorBoundary;
