import { Button, Flex, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { getStatColor, getStatLabel } from '../../../lib/statusMapper';
import type { AdminStatKey, NFTDetails } from '../../../lib/types';
import { parseMetadata } from '../../../lib/utils';
import { EyeOutlined, PlusCircleOutlined } from '@ant-design/icons';

interface UserFieldsTableProps {
  dataSource: NFTDetails[];
  onClaim: (id: string) => void;
  onView: (id: string) => void;
  loading?: boolean;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const PAGE_SIZE = 10;

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
      render: (status: AdminStatKey) => (
        <Tag color={getStatColor(status)}>{getStatLabel(status)}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Flex gap={8}>
          <Button onClick={() => onView(record.uid)} icon={<EyeOutlined />}>
            View
          </Button>
          <Tooltip title="Claim functionality coming soon">
            <Button onClick={() => onClaim(record.uid)} disabled icon={<PlusCircleOutlined />}>
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
