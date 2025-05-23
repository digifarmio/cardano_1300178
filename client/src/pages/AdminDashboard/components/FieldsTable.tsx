import { DownloadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import type { FieldRecord } from '../../../lib/types';

interface FieldsTableProps {
  dataSource: FieldRecord[];
  onView: (id: string) => void;
  onMint: (id: string) => void;
  onExport?: (format: 'csv' | 'json') => void;
  selected: {
    selectedRowKeys: React.Key[];
    setSelectedRowKeys: (keys: React.Key[]) => void;
  };
}

const FieldsTable = ({
  dataSource,
  onView,
  onMint,
  onExport,
  selected: { selectedRowKeys, setSelectedRowKeys },
}: FieldsTableProps) => {
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });

  const columns: ColumnsType<FieldRecord> = [
    {
      title: 'FIELD ID',
      dataIndex: 'fieldId',
      sorter: (a, b) => +a.fieldId - +b.fieldId,
      width: 100,
      fixed: 'left',
    },
    {
      title: 'SIZE (HA)',
      dataIndex: 'size',
      sorter: (a, b) => a.size - b.size,
      responsive: ['sm'],
      render: (size) => `${size.toLocaleString()} ha`,
    },
    {
      title: 'SUSTAINABILITY',
      dataIndex: 'sustainability',
      filters: ['High', 'Medium', 'Low'].map((val) => ({ text: val, value: val })),
      onFilter: (val, rec) => rec.sustainability === val,
      responsive: ['sm'],
      render: (s: 'High' | 'Medium' | 'Low') => (
        <Tag color={{ High: 'green', Medium: 'orange', Low: 'red' }[s]}>{s}</Tag>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      filters: ['Ready', 'Pending', 'In Progress', 'Minted'].map((val) => ({
        text: val,
        value: val,
      })),
      onFilter: (val, rec) => rec.status === val,
      responsive: ['md'],
      render: (s: 'Ready' | 'Pending' | 'In Progress' | 'Minted') => (
        <Tag
          color={{ Ready: 'green', Pending: 'gold', 'In Progress': 'orange', Minted: 'blue' }[s]}
        >
          {s}
        </Tag>
      ),
    },
    {
      title: 'ACTIONS',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type={record.status === 'Minted' ? 'default' : 'primary'}
          size="small"
          onClick={() =>
            record.status === 'Minted' ? onView(record.fieldId) : onMint(record.fieldId)
          }
          disabled={record.status === 'Pending' || record.status === 'In Progress'}
        >
          {record.status === 'Minted' ? 'View' : 'Mint'}
        </Button>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: FieldRecord) => ({
      disabled: record.status !== 'Ready',
    }),
  };

  return (
    <Table
      rowKey="fieldId"
      rowSelection={rowSelection}
      columns={columns}
      dataSource={dataSource}
      sticky
      bordered
      scroll={{ x: 800 }}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '20', '50'],
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

export default FieldsTable;
