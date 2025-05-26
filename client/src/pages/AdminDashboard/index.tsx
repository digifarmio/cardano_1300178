import { Alert, Flex, message, Modal, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import type { MintingReport, NFT, NFTDetails } from '../../lib/types';
import { MintService } from '../../services/mintService';
import AdminFieldsTable from './components/AdminFieldsTable';
import AdminMintActionBar from './components/AdminMintActionBar';
import AdminMintReportsTable from './components/AdminMintReportsTable';
import AdminNftDetails from './components/AdminNftDetails';
import AdminStats from './components/AdminStats';
import { PaginationControls } from './components/PaginationControls';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const MAX_PAGE_SIZE = 50;
const STATE_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Free', value: 'free' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Sold', value: 'sold' },
  { label: 'Error', value: 'error' },
];

const AdminDashboard = () => {
  // --- State ---
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectAllReady, setSelectAllReady] = useState(false);
  const [fieldCount, setFieldCount] = useState(1);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stateFilter, setStateFilter] = useState<string>('all');

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    reserved: 0,
    sold: 0,
    error: 0,
  });

  const [viewingNft, setViewingNft] = useState<NFTDetails | null>(null);

  // --- Fetch Data ---
  const fetchBalanace = useCallback(async () => {
    try {
      const response = await MintService.getBalance();
      const { mintCouponBalanceCardano } = response.data.data;
      setBalance(mintCouponBalanceCardano);
    } catch (error) {
      message.error('Failed to fetch balance');
      console.error(error);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await MintService.getCounts();
      const { nftTotal, free, reserved, sold, error } = response.data.data;
      setStats({
        total: nftTotal,
        free,
        reserved,
        sold,
        error,
      });
    } catch (error) {
      message.error('Failed to fetch stats');
      console.error(error);
    }
  }, []);

  const fetchNfts = useCallback(async (page: number, pageSize: number, state: string) => {
    setLoading(true);
    try {
      const limitedPageSize = Math.min(pageSize, MAX_PAGE_SIZE);
      const response = await MintService.getNfts(state, page, limitedPageSize);
      const { data } = response.data;

      setNfts(data);

      // Keep only keys from current page
      setSelectedRowKeys((keys) => keys.filter((key) => data.some((nft: NFT) => nft.uid === key)));
      setSelectAllReady(false);
    } catch (error) {
      message.error('Failed to fetch NFTs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Effects ---
  useEffect(() => {
    fetchBalanace();
  }, [fetchBalanace]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchNfts(page, pageSize, stateFilter);
  }, [page, pageSize, stateFilter, fetchNfts]);

  // --- Handlers ---
  const handleView = useCallback(async (uid: string) => {
    try {
      setLoading(true);
      const response = await MintService.getNftDetailsById(uid);
      setViewingNft(response.data.data);
    } catch (error) {
      message.error('Failed to fetch NFT details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMint = useCallback(
    async (id: string | number | bigint) => {
      try {
        await MintService.mintSpecificBatch([id]);
        message.success(`Successfully minted NFT ${id}`);
        await fetchNfts(page, pageSize, stateFilter);
        await fetchStats();
      } catch {
        message.error(`Failed to mint NFT ${id}`);
      }
    },
    [fetchNfts, fetchStats, page, pageSize, stateFilter]
  );

  const handleDownload = useCallback((report: MintingReport): void => {
    message.info(`Downloading report for ${report.date}`);
  }, []);

  const handleSelectAllReady = useCallback(() => {
    setSelectAllReady((prev) => {
      const newSelectAll = !prev;
      if (newSelectAll) {
        const readyNftIds = nfts.filter((nft) => nft.state === 'free').map((nft) => nft.uid);
        setSelectedRowKeys(readyNftIds);
      } else {
        setSelectedRowKeys([]);
      }
      return newSelectAll;
    });
  }, [nfts]);

  const handleMintRandom = useCallback(async () => {
    try {
      const result = await MintService.mintRandomBatch(fieldCount);
      message.success(`Minted ${result.data.successfulBatches} random NFTs`);
      await fetchNfts(page, pageSize, stateFilter);
      await fetchStats();
    } catch {
      message.error('Random minting failed');
    }
  }, [fieldCount, fetchNfts, fetchStats, page, pageSize, stateFilter]);

  const handleMintSelected = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('No NFTs selected for minting');
      return;
    }
    try {
      await MintService.mintSpecificBatch(selectedRowKeys);
      message.success(`Minted ${selectedRowKeys.length} selected NFTs`);
      await fetchNfts(page, pageSize, stateFilter);
      await fetchStats();
      setSelectedRowKeys([]);
      setSelectAllReady(false);
    } catch {
      message.error('Batch minting failed');
    }
  }, [selectedRowKeys, fetchNfts, fetchStats, page, pageSize, stateFilter]);

  const handleCountChange = useCallback((value: number | null) => {
    setFieldCount(value || 1);
  }, []);

  const handleFirstPage = useCallback(() => {
    if (!loading) {
      setPage(1);
    }
  }, [loading]);

  const handlePreviousPage = useCallback(() => {
    if (!loading) {
      setPage((p) => Math.max(p - 1, 1));
    }
  }, [loading]);

  const handleNextPage = useCallback(() => {
    if (!loading && nfts.length === pageSize) {
      setPage((p) => p + 1);
    }
  }, [loading, nfts.length, pageSize]);

  const handlePageSizeChange = useCallback((value: number) => {
    setPageSize(value);
    setPage(1);
  }, []);

  const handleStateFilterChange = useCallback((value: string) => {
    setStateFilter(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchStats();
    fetchBalanace();
    fetchNfts(page, pageSize, stateFilter);
  }, [fetchBalanace, fetchNfts, fetchStats, page, pageSize, stateFilter]);

  return (
    <Flex vertical gap={16}>
      <Alert
        message="This is a demonstration environment. No real blockchain transactions will be executed."
        type="info"
        closable
      />

      <AdminStats
        total={stats.total}
        free={stats.free}
        reserved={stats.reserved}
        sold={stats.sold}
        error={stats.error}
      />

      <AdminMintActionBar
        loading={loading}
        selectAll={selectAllReady}
        onSelectAllChange={handleSelectAllReady}
        fieldCount={fieldCount}
        onFieldCountChange={handleCountChange}
        onMintRandom={handleMintRandom}
        onMintSelected={handleMintSelected}
        balance={balance}
      />

      <Tabs
        defaultActiveKey="nfts"
        items={[
          {
            key: 'nfts',
            label: 'NFTs',
            children: (
              <>
                <PaginationControls
                  page={page}
                  pageSize={pageSize}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  loading={loading}
                  totalItems={stats.total}
                  stateFilter={stateFilter}
                  stateFilterOptions={STATE_FILTER_OPTIONS}
                  onFirstPage={handleFirstPage}
                  onPreviousPage={handlePreviousPage}
                  onNextPage={handleNextPage}
                  onPageSizeChange={handlePageSizeChange}
                  onStateFilterChange={handleStateFilterChange}
                  onRefresh={handleRefresh}
                />

                <AdminFieldsTable
                  dataSource={nfts}
                  onView={handleView}
                  onMint={handleMint}
                  selected={{
                    selectedRowKeys,
                    setSelectedRowKeys,
                  }}
                  loading={loading}
                />
              </>
            ),
          },
          {
            key: 'reports',
            label: 'Mint Reports',
            children: <AdminMintReportsTable data={[]} onDownload={handleDownload} />,
          },
        ]}
      />

      <Modal
        title="NFT Details"
        open={!!viewingNft}
        onCancel={() => setViewingNft(null)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
      >
        {viewingNft && <AdminNftDetails nft={viewingNft} />}
      </Modal>
    </Flex>
  );
};

export default AdminDashboard;
