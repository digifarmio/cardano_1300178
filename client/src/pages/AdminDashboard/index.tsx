import { Alert, Flex, Tabs, message } from 'antd';
import { useState } from 'react';
import type { MintingReport } from '../../lib/types';
import { generateFieldsRecords, mockData } from '../../lib/utils';
import AdminFieldsTable from './components/AdminFieldsTable';
import AdminMintActionBar from './components/AdminMintActionBar';
import AdminMintReportsTable from './components/AdminMintReportsTable';
import AdminStats from './components/AdminStats';

const AdminDashboard = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectAllReady, setSelectAllReady] = useState(false);
  const [fieldCount, setFieldCount] = useState(5);
  const [fieldsData, setFieldsData] = useState(generateFieldsRecords(10000));

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

  const handleDownload = (report: MintingReport): void => {
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

      <AdminMintActionBar
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
              <AdminFieldsTable
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
            children: <AdminMintReportsTable data={mockData} onDownload={handleDownload} />,
          },
        ]}
      />
    </Flex>
  );
};

export default AdminDashboard;
