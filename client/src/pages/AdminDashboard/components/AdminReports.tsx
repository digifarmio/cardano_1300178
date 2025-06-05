import { Button, Card, Flex, Progress, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CloudDownloadOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ReportStatus } from '../../../lib/types';
import { getStatusColor } from '../../../lib/utils';

const { Text, Title } = Typography;

interface AdminReportsProps {
  reports: ReportStatus[];
  loading: {
    list: boolean;
    generate: boolean;
    delete: boolean;
    download: boolean;
  };
  deletingId: string | null;
  downloadingId: string | null;
  onGenerateReport: () => Promise<{ reportId: string; statusUrl: string }>;
  onDownloadReport: (reportId: string, type: 'csv') => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const AdminReports = ({
  reports,
  loading,
  deletingId,
  downloadingId,
  onGenerateReport,
  onDownloadReport,
  onDeleteReport,
  onRefresh,
}: AdminReportsProps) => {
  const statusCounts = reports.reduce(
    (acc, report) => {
      acc[report.status as keyof typeof acc]++;
      return acc;
    },
    { queued: 0, processing: 0, completed: 0, failed: 0 }
  );

  const columns: ColumnsType<ReportStatus> = [
    {
      title: 'Report ID',
      dataIndex: 'id',
      key: 'id',
      fixed: 'left',
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable={{ text: id }} className="block max-w-full truncate whitespace-nowrap">
            {`${id.substring(0, 8)}...${id.substring(id.length - 8)}`}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <Tag className="min-w-[80px] text-center" color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number | undefined) => (
        <Progress percent={progress ?? 0} size="small" status="active" />
      ),
    },
    {
      title: 'Error Details',
      key: 'error',
      width: 300,
      ellipsis: true,
      render: (_, record) => {
        if (!record.error) return '';

        return (
          <Tooltip title={record.error.message} placement="topLeft">
            <Text type="danger" className="block text-xs">
              {record.error.message.length > 100
                ? `${record.error.message.substring(0, 100)}...`
                : record.error.message}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <Flex vertical>
          <Text>{new Date(date).toLocaleDateString()}</Text>
          <Text type="secondary">{new Date(date).toLocaleTimeString()}</Text>
        </Flex>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        const canDownload = record.status === 'completed' && record.csvPath;
        const isDeleting = deletingId === record.id;
        const isDownloading = downloadingId === record.id;

        return (
          <Flex align="center" justify="center" gap={8}>
            <Button
              danger
              size="small"
              onClick={() => onDeleteReport(record.id)}
              loading={isDeleting}
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
            <Button
              size="small"
              onClick={() => onDownloadReport(record.id, 'csv')}
              disabled={!canDownload || loading.download}
              loading={isDownloading}
              icon={<CloudDownloadOutlined />}
            >
              CSV
            </Button>
          </Flex>
        );
      },
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex vertical align="center" justify="center" gap={16}>
          <Title level={4}>Minting Reports</Title>
          <Text type="secondary">Generate and manage minting reports</Text>
          <Space>
            <Button
              type="primary"
              onClick={onGenerateReport}
              loading={loading.generate}
              icon={<CloudDownloadOutlined />}
            >
              Generate Report
            </Button>
            <Button onClick={onRefresh} loading={loading.list} icon={<ReloadOutlined />}>
              Refresh
            </Button>
          </Space>
        </Flex>
      </Card>

      <Card
        title="Report History"
        extra={
          <Space>
            <Tag color="orange">Queued: {statusCounts.queued}</Tag>
            <Tag color="blue">Processing: {statusCounts.processing}</Tag>
            <Tag color="green">Completed: {statusCounts.completed}</Tag>
            <Tag color="red">Failed: {statusCounts.failed}</Tag>
            <Text type="secondary">Total: {reports.length}</Text>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={reports}
          loading={loading.list}
          bordered
          scroll={{ x: 1000 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} reports`,
          }}
        />
      </Card>
    </Flex>
  );
};

export default AdminReports;
