import { Button, Flex, InputNumber, Select, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  loading: boolean;
  totalItems: number;
  stateFilter: string;
  pageSizeOptions?: number[];
  stateFilterOptions: { label: string; value: string }[];
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (value: number) => void;
  onStateFilterChange: (value: string) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  page,
  pageSize,
  loading,
  totalItems,
  stateFilter,
  pageSizeOptions = [10, 20, 50, 100],
  stateFilterOptions,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onPageChange,
  onPageSizeChange,
  onStateFilterChange,
  onRefresh,
}) => {
  const isLastPage = totalItems <= page * pageSize;

  return (
    <Flex wrap="wrap" align="center" justify="space-between" className="gap-4">
      <Flex wrap="wrap" align="center" className="gap-4">
        {/* First & Previous */}
        <Button disabled={page === 1 || loading} onClick={onFirstPage}>
          First Page
        </Button>
        <Button disabled={page === 1 || loading} onClick={onPreviousPage}>
          Previous Page
        </Button>

        {/* Page Input and Size Selector */}
        <Flex align="center" className="gap-2" wrap>
          <Space>
            <span className="text-sm">Page:</span>
            <InputNumber
              min={1}
              value={page}
              onChange={(value) => value && onPageChange(value)}
              style={{ width: 70 }}
              disabled={loading}
            />
          </Space>
          <Space>
            <span className="text-sm">Size:</span>
            <Select
              size="middle"
              className="w-20"
              value={pageSize}
              onChange={onPageSizeChange}
              options={pageSizeOptions.map((size) => ({
                label: size,
                value: size,
              }))}
              disabled={loading}
            />
          </Space>
        </Flex>

        {/* Next */}
        <Button disabled={loading || isLastPage} onClick={onNextPage}>
          Next Page
        </Button>

        {/* Filter */}
        <Flex align="center" className="gap-2">
          <span className="text-sm">Status:</span>
          <Select
            size="middle"
            className="w-32"
            value={stateFilter}
            onChange={onStateFilterChange}
            options={stateFilterOptions}
            disabled={loading}
          />
        </Flex>
      </Flex>

      {/* Refresh button on the far right */}
      <Button type="default" onClick={onRefresh} loading={loading} icon={<ReloadOutlined />}>
        Refresh
      </Button>
    </Flex>
  );
};

export default PaginationControls;
