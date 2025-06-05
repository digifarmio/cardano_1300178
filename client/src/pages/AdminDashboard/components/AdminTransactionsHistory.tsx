import { Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { GetTransactionNfts, ProjectTransaction } from '../../../lib/types';
import { lovelaceToAda } from '../../../lib/utils';

const { Text } = Typography;

interface AdminTransactionsHistoryProps {
  data: ProjectTransaction[];
  loading: boolean;
}

const AdminTransactionsHistory = ({ data, loading }: AdminTransactionsHistoryProps) => {
  const expandedRowRender = (transaction: ProjectTransaction) => {
    if (!transaction.transactionNfts || transaction.transactionNfts.length === 0) {
      return <Text type="secondary">No NFTs in this transaction</Text>;
    }

    const nftColumns: ColumnsType<GetTransactionNfts> = [
      {
        title: 'Asset Name',
        dataIndex: 'assetName',
        key: 'assetName',
        render: (name: string) => (
          <Text copyable code>
            {name}
          </Text>
        ),
      },
      {
        title: 'Fingerprint',
        dataIndex: 'fingerprint',
        key: 'fingerprint',
        render: (fingerprint: string | null | undefined) => {
          if (!fingerprint) {
            return <Text type="secondary">N/A</Text>;
          }

          return (
            <Tooltip title={fingerprint}>
              <Text
                copyable={{ text: fingerprint }}
                className="block max-w-full truncate whitespace-nowrap"
              >
                {`${fingerprint.substring(0, 8)}...${fingerprint.substring(fingerprint.length - 8)}`}
              </Text>
            </Tooltip>
          );
        },
      },
      {
        title: 'Token Count',
        dataIndex: 'tokenCount',
        key: 'tokenCount',
      },
      {
        title: 'Multiplier',
        dataIndex: 'multiplier',
        key: 'multiplier',
      },
      {
        title: 'Confirmed',
        dataIndex: 'confirmed',
        key: 'confirmed',
        render: (confirmed: boolean) => (
          <Tag color={confirmed ? 'green' : 'orange'}>{confirmed ? 'CONFIRMED' : 'PENDING'}</Tag>
        ),
      },
      {
        title: 'Transaction Hash',
        dataIndex: 'txHashSolanaTransaction',
        key: 'txHashSolanaTransaction',
        render: (hash: string) => (
          <Tooltip title={hash}>
            <Text copyable={{ text: hash }} className="block max-w-full truncate whitespace-nowrap">
              {`${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`}
            </Text>
          </Tooltip>
        ),
      },
    ];

    return (
      <Table
        rowKey="assetName"
        columns={nftColumns}
        dataSource={transaction.transactionNfts}
        loading={loading}
        bordered
        scroll={{ x: 1000 }}
        pagination={false}
      />
    );
  };

  const columns: ColumnsType<ProjectTransaction> = [
    {
      title: 'Date',
      dataIndex: 'created',
      key: 'created',
      render: (date: string) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime(),
    },
    {
      title: 'Transaction ID',
      dataIndex: 'transactionid',
      key: 'transactionid',
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable={{ text: id }} className="block max-w-full truncate whitespace-nowrap">
            {`${id.substring(0, 8)}...${id.substring(id.length - 8)}`}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Blockchain',
      dataIndex: 'blockchain',
      key: 'blockchain',
      render: (blockchain: string) => <Tag color="blue">{blockchain}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      render: (_: string, record: ProjectTransaction) => {
        const isConfirmed = record.confirmed;
        const status = isConfirmed ? 'CONFIRMED' : record.state?.toUpperCase() || 'PENDING';

        return <Tag color={isConfirmed ? 'green' : 'orange'}>{status}</Tag>;
      },
    },
    {
      title: 'NFTs',
      dataIndex: 'nftcount',
      key: 'nftcount',
      render: (count: number, record) => (
        <Space>
          <Text>{count}</Text>
          {record.transactionNfts && record.transactionNfts.length > 0 && (
            <Text type="secondary">({record.transactionNfts.length} details)</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{lovelaceToAda(record.ada)} ADA</Text>
          <Text type="secondary">Fee: {lovelaceToAda(record.fee)} ADA</Text>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="transactionid"
      columns={columns}
      loading={loading}
      dataSource={data}
      bordered
      scroll={{ x: 1000 }}
      expandable={{ expandedRowRender }}
      pagination={{
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`,
      }}
    />
  );
};

export default AdminTransactionsHistory;
