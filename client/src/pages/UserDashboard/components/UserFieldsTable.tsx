import { Table, Tooltip, Button, Flex, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { NFTDetails } from '../../../lib/types';
import { parseMetadata } from '../../../lib/utils';

interface UserFieldsTableProps {
  dataSource: NFTDetails[];
  onClaim: (id: string) => void;
  onView: (id: string) => void;
  loading?: boolean;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  free: 'green',
  reserved: 'gold',
  sold: 'blue',
  error: 'red',
  pending: 'orange',
};

const UserFieldsTable = ({ dataSource, onClaim, onView, loading }: UserFieldsTableProps) => {
  const enhancedDataSource = dataSource.map((record) => ({
    ...record,
    parsedMetadata: parseMetadata(record.metadata),
  }));

  const columns: ColumnsType<NFTDetails & { parsedMetadata?: ReturnType<typeof parseMetadata> }> = [
    {
      title: 'Field ID',
      key: 'field_id',
      render: (_, record) => record.parsedMetadata?.id_long || record.parsedMetadata?.id || 'N/A',
    },
    {
      title: 'Area (m2)',
      key: 'area',
      render: (_, record) => record.parsedMetadata?.area ?? 'N/A',
    },
    {
      title: 'Sustainability Index',
      key: 'SustInd',
      render: (_, record) => record.parsedMetadata?.SustInd ?? 'N/A',
    },
    {
      title: 'Country',
      key: 'country',
      render: (_, record) => record.parsedMetadata?.country ?? 'N/A',
    },
    {
      title: 'State',
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
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Flex gap={8}>
          <Button onClick={() => onView(record.uid)}>View</Button>
          <Tooltip title="Claim functionality coming soon">
            <Button onClick={() => onClaim(record.uid)} disabled>
              Claim
            </Button>
          </Tooltip>
        </Flex>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={enhancedDataSource}
      rowKey="uid"
      loading={loading}
      pagination={{
        showSizeChanger: true,
        defaultPageSize: PAGE_SIZE,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
      }}
    />
  );
};

export default UserFieldsTable;
