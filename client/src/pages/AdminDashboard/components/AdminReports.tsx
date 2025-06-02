import { Button, Card, Flex, message, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import pRetry from 'p-retry';
import { useState } from 'react';
import type { ReportStatus } from '../../../lib/types';
import { CloudDownloadOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const MAX_RETRIES = 5;
const DELAY = 1000; // 1 second delay for retries
const MAX_TIMEOUT = 3000; // 3 seconds max timeout for each status check

interface AdminReportsProps {
  onGenerateReport: () => Promise<{ reportId: string; statusUrl: string }>;
  onDownloadReport: (reportId: string, type: 'csv' | 'pdf') => Promise<void>;
  onGetStatus: (reportId: string) => Promise<ReportStatus>;
}

const AdminReports = ({ onGenerateReport, onDownloadReport, onGetStatus }: AdminReportsProps) => {
  const [activeReports, setActiveReports] = useState<Record<string, ReportStatus>>({});
  const [generating, setGenerating] = useState(false);

  // Poll status with retry + exponential backoff
  const pollReportStatus = async (reportId: string) => {
    const fetchStatus = async () => {
      const status = await onGetStatus(reportId);
      setActiveReports((prev) => ({
        ...prev,
        [reportId]: status,
      }));

      if (status.status === 'completed' || status.status === 'failed') {
        // Completed or failed → stop retrying by resolving
        return status;
      }

      // Otherwise throw to retry after backoff delay
      throw new Error('Report not ready yet');
    };

    return pRetry(fetchStatus, {
      retries: MAX_RETRIES,
      factor: 2, // exponential backoff multiplier
      minTimeout: DELAY,
      maxTimeout: MAX_TIMEOUT,
      onFailedAttempt: (error) => {
        console.log(`Attempt ${error.attemptNumber} failed for report ${reportId}. Retrying...`);
      },
    }).catch((error) => {
      console.error(`Polling failed for report ${reportId}:`, error);
      setActiveReports((prev) => ({
        ...prev,
        [reportId]: {
          ...prev[reportId],
          status: 'failed',
        },
      }));
    });
  };

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

      // Start polling status with retry logic (no concurrency limit needed)
      await pollReportStatus(reportId);
    } catch (error) {
      console.error('Error generating report:', error);
      message.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'processing':
        return 'blue';
      case 'pending':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const columns: ColumnsType<ReportStatus & { reportId: string }> = [
    {
      title: 'Report ID',
      dataIndex: 'reportId',
      key: 'reportId',
      fixed: 'left',
      width: 300,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable className="block max-w-full truncate whitespace-nowrap">
            {id}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag className="min-w-[70px] text-center" color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (_: unknown, record: ReportStatus) => {
        if (record.status === 'failed' && record.error?.message) {
          return (
            <Tooltip title={record.error.message}>
              <Text type="danger" className="block max-w-full truncate whitespace-nowrap">
                {record.error.message}
              </Text>
            </Tooltip>
          );
        }
        return '-';
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: unknown, record: ReportStatus & { reportId: string }) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => onDownloadReport(record.reportId, 'csv')}
            disabled={record.status !== 'completed'}
            icon={<CloudDownloadOutlined />}
          >
            Download CSV
          </Button>
          {/* <Button
            size="small"
            onClick={() => onDownloadReport(record.reportId, 'pdf')}
            disabled={record.status !== 'completed'}
          >
            Download PDF
          </Button> */}
        </Space>
      ),
    },
  ];

  return (
    <Flex vertical gap={16}>
      <Card>
        <Flex vertical align="center" justify="center" gap={16}>
          <Title level={4}>Generate New Report</Title>
          <Text type="secondary">
            Reports are generated asynchronously. You can track progress below.
          </Text>
          <Button
            type="primary"
            onClick={handleGenerate}
            loading={generating}
            icon={<CloudDownloadOutlined />}
          >
            Generate Full Report
          </Button>
        </Flex>
      </Card>

      <Table
        columns={columns}
        dataSource={Object.entries(activeReports).map(([reportId, status]) => ({
          reportId,
          ...status,
        }))}
        rowKey="reportId"
        pagination={false}
      />
    </Flex>
  );
};

export default AdminReports;
