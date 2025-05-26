import { Button, Card, message, Progress, Space, Table, Tag, Typography } from 'antd';
import { useState } from 'react';
import type { ReportStatus } from '../../../lib/types';

const { Text, Title } = Typography;

interface AdminReportsProps {
  onGenerateReport: () => Promise<{ reportId: string; statusUrl: string }>;
  onDownloadReport: (reportId: string, type: 'csv' | 'pdf') => Promise<void>;
  onGetStatus: (reportId: string) => Promise<ReportStatus>;
}

const AdminReports = ({ onGenerateReport, onDownloadReport, onGetStatus }: AdminReportsProps) => {
  const [activeReports, setActiveReports] = useState<Record<string, ReportStatus>>({});
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const { reportId } = await onGenerateReport();
      setActiveReports((prev) => ({
        ...prev,
        [reportId]: {
          id: reportId,
          status: 'pending',
          progress: 0,
          createdAt: new Date().toISOString(),
        },
      }));
      startPolling(reportId);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const startPolling = (reportId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await onGetStatus(reportId);
        setActiveReports((prev) => ({
          ...prev,
          [reportId]: status,
        }));

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling report status:', error);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds
  };

  const columns = [
    {
      title: 'Report ID',
      dataIndex: 'reportId',
      key: 'reportId',
      render: (id: string) => <Text copyable>{id}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ReportStatus & { progress?: number }) => (
        <Space>
          <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
          {status === 'processing' && (
            <Progress percent={record.progress ?? 0} size="small" style={{ width: 200 }} />
          )}
        </Space>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ReportStatus & { reportId: string }) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => onDownloadReport(record.reportId, 'csv')}
            disabled={record.status !== 'completed'}
          >
            Download CSV
          </Button>
          <Button
            size="small"
            onClick={() => onDownloadReport(record.reportId, 'pdf')}
            disabled={record.status !== 'completed'}
          >
            Download PDF
          </Button>
        </Space>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'processing':
        return 'blue';
      default:
        return 'orange';
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={4}>Generate New Report</Title>
          <Text type="secondary">
            Reports are generated asynchronously. You can track progress below.
          </Text>
          <Button
            type="primary"
            onClick={handleGenerate}
            loading={generating}
            style={{ marginTop: 16 }}
          >
            Generate Full Report
          </Button>
        </Space>
      </Card>

      <Card>
        <Title level={4}>Active Reports</Title>
        <Table
          columns={columns}
          dataSource={Object.entries(activeReports).map(([reportId, status]) => ({
            reportId,
            ...status,
          }))}
          rowKey="reportId"
          loading={generating}
          pagination={false}
        />
      </Card>
    </Space>
  );
};

export default AdminReports;
