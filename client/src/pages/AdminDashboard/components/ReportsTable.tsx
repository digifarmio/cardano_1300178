import { DownloadOutlined } from '@ant-design/icons';
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface MintingReport {
  date: string;
  totalFields: number;
  minted: number;
  failed: number;
  csvUrl?: string; // Optional direct download link
}

interface ReportsTableProps {
  data: MintingReport[];
  onDownload: (report: MintingReport) => void;
}

const ReportsTable = ({ data, onDownload }: ReportsTableProps) => {
  const columns: ColumnsType<MintingReport> = [
    {
      title: 'DATE',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'FIELDS',
      dataIndex: 'totalFields',
      key: 'totalFields',
      render: (val: number) => `${val} fields`,
    },
    {
      title: 'STATUS',
      key: 'status',
      render: (_, record) => {
        const { minted, failed } = record;
        if (failed > 0) {
          return `${minted} minted, ${failed} failed`;
        }
        return `${minted} minted`;
      },
    },
    {
      title: 'ACTIONS',
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
      rowKey="date"
      columns={columns}
      dataSource={data}
      pagination={false}
      bordered
      title={() => <h3 style={{ margin: 0 }}>Minting Reports</h3>}
    />
  );
};

export default ReportsTable;
