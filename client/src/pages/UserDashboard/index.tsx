import { Alert, Flex } from 'antd';
import console from 'console';
import { useState } from 'react';
import { generateNftsRecords } from '../../lib/utils';
import UserFieldsTable from './components/UserFieldsTable';

const UserDashboard = () => {
  const [fieldsData] = useState(generateNftsRecords(10000));

  const handleClaim = (id: string) => {
    console.log('🚀 ~ handleClaim ~ id:', id);
  };

  const handleView = (id: string) => {
    console.log('🚀 ~ handleView ~ id:', id);
  };

  return (
    <Flex vertical gap={24}>
      <Alert
        message="Warning"
        description="Transactions will be on-chain. Network is set by your NMKR API key."
        type="warning"
        showIcon
        closable
      />
      <UserFieldsTable dataSource={fieldsData} onClaim={handleClaim} onView={handleView} />
    </Flex>
  );
};

export default UserDashboard;
