import { Button, Flex, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo } from 'react';
import type { NFT } from '../../../lib/types';

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

const statusColors: Record<string, string> = {
  free: 'green',
  reserved: 'gold',
  sold: 'blue',
  error: 'red',
  pending: 'orange',
};

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
        title: 'ID',
        dataIndex: 'id',
      },
      {
        title: 'UID',
        dataIndex: 'uid',
        ellipsis: true,
      },
      {
        title: 'NAME',
        dataIndex: 'name',
        responsive: ['sm'],
      },
      {
        title: 'ASSET ID',
        dataIndex: 'assetId',
        responsive: ['xl'],
        ellipsis: true,
      },
      {
        title: 'STATE',
        dataIndex: 'state',
        width: 100,
        responsive: ['md'],
        filters: Object.keys(statusColors).map((val) => ({
          text: val.charAt(0).toUpperCase() + val.slice(1),
          value: val,
        })),
        onFilter: (val, rec) => rec.state === val,
        render: (status: string) => (
          <Tag color={statusColors[status] || 'default'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Tag>
        ),
      },
      {
        title: 'ACTIONS',
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
            >
              View
            </Button>
            <Button
              className="flex"
              size="small"
              onClick={() => onMint(record.uid)}
              loading={loading}
              disabled={loading || record.state !== 'free'}
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
