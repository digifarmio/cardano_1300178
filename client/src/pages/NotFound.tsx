import { Button, Flex, Result } from 'antd';
import { useNavigate } from 'react-router';

const NotFound = () => {
  const navigate = useNavigate();

  const handleBackHome = () => {
    navigate('/');
  };

  return (
    <Flex justify="center" align="center" className="min-h-screen">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button type="primary" onClick={handleBackHome}>
            Back Home
          </Button>
        }
      />
    </Flex>
  );
};

export default NotFound;
