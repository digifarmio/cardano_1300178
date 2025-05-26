import { Button, Flex, Select } from 'antd';

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
  onPageSizeChange,
  onStateFilterChange,
  onRefresh,
}) => {
  const isLastPage = totalItems <= page * pageSize;

  return (
    <Flex wrap="wrap" align="center" justify="space-between" className="gap-4">
      <Flex wrap="wrap" align="center" className="gap-4">
        {/* First & Previous */}
        <Flex className="gap-2">
          <Button disabled={page === 1 || loading} onClick={onFirstPage}>
            First Page
          </Button>
          <Button disabled={page === 1 || loading} onClick={onPreviousPage}>
            Previous Page
          </Button>
        </Flex>

        {/* Page Info + Page Size */}
        <Flex align="center" className="gap-2">
          <span className="text-sm">Page {page}</span>
          <span className="text-gray-400">|</span>
          <span className="text-sm">Page Size:</span>
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
        </Flex>

        {/* Next */}
        <Button disabled={loading || isLastPage} onClick={onNextPage}>
          Next Page
        </Button>

        {/* Filter */}
        <Flex align="center" className="gap-2">
          <span className="text-gray-400">|</span>
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
      <Button onClick={onRefresh} loading={loading} type="default">
        Refresh
      </Button>
    </Flex>
  );
};

export default PaginationControls;
