import { DownloadOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CustomerTransaction, GetTransactionNfts } from '../../../lib/types';

const { Text } = Typography;

interface AdminTransactionsHistoryProps {
  data: CustomerTransaction[];
  loading: boolean;
  onDownload: (transaction: CustomerTransaction) => void;
}

const AdminTransactionsHistory = ({ data, loading, onDownload }: AdminTransactionsHistoryProps) => {
  const expandedRowRender = (transaction: CustomerTransaction) => {
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
        render: (fingerprint: string) => (
          <Text copyable ellipsis style={{ maxWidth: '200px' }}>
            {fingerprint}
          </Text>
        ),
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
          <Text copyable ellipsis style={{ maxWidth: '150px' }}>
            {hash}
          </Text>
        ),
      },
    ];

    return (
      <Table
        columns={nftColumns}
        dataSource={transaction.transactionNfts}
        rowKey="fingerprint"
        pagination={false}
        size="small"
      />
    );
  };

  const columns: ColumnsType<CustomerTransaction> = [
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
        <Text copyable ellipsis style={{ maxWidth: '150px', display: 'inline-block' }}>
          {id}
        </Text>
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
      render: (state: string) => (
        <Tag color={state === 'confirmed' ? 'green' : 'orange'}>
          {state?.toUpperCase() || 'PENDING'}
        </Tag>
      ),
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
          <Text strong>{record.ada} ADA</Text>
          <Text type="secondary">Fee: {record.fee} ADA</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button icon={<DownloadOutlined />} onClick={() => onDownload(record)} size="small">
          CSV
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="transactionid"
      columns={columns}
      loading={loading}
      dataSource={data}
      expandable={{
        expandedRowRender,
        expandIcon: ({ expanded, onExpand, record }) =>
          expanded ? (
            <UpOutlined onClick={(e) => onExpand(record, e)} />
          ) : (
            <DownOutlined onClick={(e) => onExpand(record, e)} />
          ),
      }}
      bordered
      title={() => <h3 style={{ margin: 0 }}>Transaction History</h3>}
    />
  );
};

export default AdminTransactionsHistory;
