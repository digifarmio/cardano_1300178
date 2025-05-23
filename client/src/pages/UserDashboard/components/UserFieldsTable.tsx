import { DownloadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import type { FieldRecord } from '../../../lib/types';

interface UserFieldsTableProps {
  dataSource: FieldRecord[];
  onClaim: (id: string) => void;
  onView: (id: string) => void;
  onExport?: (format: 'csv' | 'json') => void;
}

const UserFieldsTable = ({ dataSource, onClaim, onView, onExport }: UserFieldsTableProps) => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const columns: ColumnsType<FieldRecord> = [
    {
      title: 'FIELD ID',
      dataIndex: 'fieldId',
      key: 'fieldId',
      width: 100,
      fixed: 'left',
      sorter: (a, b) => +a.fieldId - +b.fieldId,
    },
    {
      title: 'SIZE (HA)',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => size.toFixed(2),
      sorter: (a, b) => a.size - b.size,
      responsive: ['sm'],
    },
    {
      title: 'SUSTAINABILITY',
      dataIndex: 'sustainability',
      sorter: (a, b) => {
        const toNumber = (val: string | number) => Number(val);
        return toNumber(a.sustainability) - toNumber(b.sustainability);
      },
      responsive: ['sm'],
      render: (s: string | number) => `${s}%`,
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'All Fields', value: 'All Fields' },
        { text: 'Claimable', value: 'Claimable' },
        { text: 'Owned', value: 'Owned' },
        { text: 'Locked', value: 'Locked' },
      ],
      responsive: ['md'],
      onFilter: (value: boolean | React.Key, record) =>
        value === true || value === false
          ? true
          : value === 'All Fields'
            ? true
            : record.status === value,
      render: (status: string) => {
        const color = status === 'Claimable' ? 'green' : status === 'Owned' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_: unknown, record: FieldRecord) => (
        <Space size="small">
          {record.status === 'Claimable' && (
            <Button type="primary" size="small" onClick={() => onClaim(record.fieldId)}>
              Claim NFT
            </Button>
          )}
          {record.status === 'Owned' && (
            <Button size="small" onClick={() => onView(record.fieldId)}>
              View NFT
            </Button>
          )}
          {record.status === 'Locked' && (
            <Button disabled size="small">
              Not Available
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="fieldId"
      columns={columns}
      dataSource={dataSource}
      sticky
      bordered
      scroll={{ x: 800 }}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50'],
        showTotal: (total) => `Total ${total} items`,
        position: ['bottomRight'],
        onChange: (current, pageSize) => setPagination({ current, pageSize }),
        onShowSizeChange: (_, size) => setPagination({ current: 1, pageSize: size }),
      }}
      title={() => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Available Fields</h3>
          {onExport && (
            <Dropdown
              menu={{
                items: ['csv', 'json'].map((f) => ({
                  key: f,
                  label: `Export as ${f.toUpperCase()}`,
                })),
                onClick: ({ key }) => onExport(key as 'csv' | 'json'),
              }}
            >
              <Button icon={<DownloadOutlined />} type="default" size="middle">
                Export Data
              </Button>
            </Dropdown>
          )}
        </div>
      )}
    />
  );
};

export default UserFieldsTable;
