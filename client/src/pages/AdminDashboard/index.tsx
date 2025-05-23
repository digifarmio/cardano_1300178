import { Alert, Flex, Tabs, message } from 'antd';
import { useState } from 'react';
import type { MintReport } from '../../lib/types';
import AdminStats from './components/AdminStats';
import FieldsTable from './components/FieldsTable';
import MintActionBar from './components/MintActionBar';
import ReportsTable from './components/ReportsTable';

const sustainabilityLevels = ['High', 'Medium', 'Low'];
const statuses = ['Ready', 'Pending', 'In Progress', 'Minted'];

const generateRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    fieldId: (i + 1).toString(),
    size: Math.floor(Math.random() * 91) + 10,
    sustainability: sustainabilityLevels[i % sustainabilityLevels.length],
    status: statuses[i % statuses.length],
  }));

const mockData = [
  { date: '2025-05-20', totalFields: 24, minted: 22, failed: 2 },
  { date: '2025-05-18', totalFields: 43, minted: 43, failed: 0 },
  { date: '2025-05-15', totalFields: 59, minted: 56, failed: 3 },
];

const AdminDashboard = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectAllReady, setSelectAllReady] = useState(false);
  const [fieldCount, setFieldCount] = useState(5);
  const [fieldsData, setFieldsData] = useState(generateRecords(10000));

  const handleView = (id: string | number | bigint) => {
    message.info(`Viewing field with ID: ${id}`);
  };

  const handleMint = (id: string | number | bigint) => {
    setFieldsData((prevData) =>
      prevData.map((field) => (field.fieldId === id ? { ...field, status: 'Minted' } : field))
    );
    message.success(`Successfully minted field ${id}`);
  };

  const handleExport = (format: 'csv' | 'json') => {
    message.info(`Exporting data as ${format.toUpperCase()}`);
  };

  const handleDownload = (report: MintReport): void => {
    console.log('Download CSV for:', report.date);
    message.info(`Downloading report for ${report.date}`);
  };

  const handleSelectAllReady = (checked: boolean) => {
    setSelectAllReady(checked);
    if (checked) {
      const readyFieldIds = fieldsData
        .filter((field) => field.status === 'Ready')
        .map((field) => field.fieldId);
      setSelectedRowKeys(readyFieldIds);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleMintRandom = () => {
    const readyFields = fieldsData.filter((field) => field.status === 'Ready');
    if (readyFields.length === 0) {
      message.warning('No ready fields available to mint');
      return;
    }

    const randomCount = Math.min(fieldCount, readyFields.length);
    const randomSelection = [...readyFields]
      .sort(() => 0.5 - Math.random())
      .slice(0, randomCount)
      .map((field) => field.fieldId);

    randomSelection.forEach((id) => handleMint(id));
    message.success(`Minted ${randomCount} random fields`);
  };

  const handleMintSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('No fields selected for minting');
      return;
    }

    selectedRowKeys.forEach((id) => {
      const field = fieldsData.find((f) => f.fieldId === id);
      if (field && field.status === 'Ready') {
        handleMint(id);
      }
    });
    setSelectedRowKeys([]);
    message.success(`Minted ${selectedRowKeys.length} selected fields`);
  };

  const handleCountChange = (value: number | null) => {
    setFieldCount(value || 1);
  };

  return (
    <Flex vertical gap={24}>
      <Alert
        message="This is a demonstration environment. No real blockchain transactions will be executed."
        type="info"
      />

      <AdminStats
        totalFields={fieldsData.length}
        mintedNFTs={fieldsData.filter((f) => f.status === 'Minted').length}
        readyToMint={fieldsData.filter((f) => f.status === 'Ready').length}
        processing={fieldsData.filter((f) => f.status === 'In Progress').length}
      />

      <MintActionBar
        selectAll={selectAllReady}
        onSelectAllChange={handleSelectAllReady}
        fieldCount={fieldCount}
        onFieldCountChange={handleCountChange}
        onMintRandom={handleMintRandom}
        onMintSelected={handleMintSelected}
      />

      <Tabs
        defaultActiveKey="1"
        items={[
          {
            key: '1',
            label: 'Field Management',
            children: (
              <FieldsTable
                dataSource={fieldsData}
                onView={handleView}
                onMint={handleMint}
                onExport={handleExport}
                selected={{
                  selectedRowKeys,
                  setSelectedRowKeys,
                }}
              />
            ),
          },
          {
            key: '2',
            label: 'Minting Reports',
            children: <ReportsTable data={mockData} onDownload={handleDownload} />,
          },
        ]}
      />
    </Flex>
  );
};

export default AdminDashboard;
