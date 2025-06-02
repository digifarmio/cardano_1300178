import { Button, Flex, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import { getStatColor, getStatLabel } from '../../../lib/statusMapper';
import type { AdminStatKey, NFT } from '../../../lib/types';
import { EyeOutlined, PlusCircleOutlined } from '@ant-design/icons';

interface AdminFieldsTableProps {
  dataSource: NFT[];
  loading: boolean;
  selected: {
    selectedRowKeys: React.Key[];
    setSelectedRowKeys: (keys: React.Key[]) => void;
  };
  onView: (id: string) => void;
  onMint: (id: string) => void;
  onExport?: (format: 'csv' | 'json') => void;
}

const AdminFieldsTable = ({
  dataSource,
  loading,
  selected: { selectedRowKeys, setSelectedRowKeys },
  onView,
  onMint,
}: AdminFieldsTableProps) => {
  const columns = useMemo<ColumnsType<NFT>>(
    () => [
      {
        title: 'Id',
        dataIndex: 'id',
      },
      {
        title: 'Uid',
        dataIndex: 'uid',
        ellipsis: true,
      },
      {
        title: 'Name',
        dataIndex: 'name',
        responsive: ['sm'],
      },
      {
        title: 'Asset Id',
        dataIndex: 'assetId',
        responsive: ['xl'],
        ellipsis: true,
      },
      {
        title: 'State',
        dataIndex: 'state',
        width: 100,
        responsive: ['md'],
        render: (status: AdminStatKey) => (
          <Tag color={getStatColor(status)}>{getStatLabel(status)}</Tag>
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        width: 150,
        fixed: 'right',
        render: (_, record) => (
          <Flex align="center" justify="center" gap={8}>
            <Button
              className="flex"
              size="small"
              onClick={() => onView(record.uid)}
              loading={loading}
              icon={<EyeOutlined />}
            >
              View
            </Button>
            <Button
              className="flex"
              size="small"
              onClick={() => onMint(record.uid)}
              loading={loading}
              disabled={loading || record.state !== 'free'}
              icon={<PlusCircleOutlined />}
            >
              Mint
            </Button>
          </Flex>
        ),
      },
    ],
    [loading, onMint, onView]
  );

  const rowSelection = {
    selectedRowKeys,
    preserveSelectedRowKeys: true,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: NFT) => ({
      disabled: record.state !== 'free',
    }),
  };

  return (
    <Table
      rowKey="uid"
      rowSelection={rowSelection}
      columns={columns}
      loading={loading}
      dataSource={dataSource}
      sticky
      bordered
      scroll={{ x: 1200 }}
      pagination={false}
    />
  );
};

export default AdminFieldsTable;
