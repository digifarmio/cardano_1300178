import { Alert, Button, Flex, Grid, Input, message, Modal, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../lib/errorHandler';
import { getStatLabel } from '../../lib/statusMapper';
import type { AdminStatKey, NFT, NFTDetails, ProjectTransaction } from '../../lib/types';
import { MintService } from '../../services/mintService';
import { useSelectionStore } from '../../stores/selectionStore';
import AdminFieldsTable from './components/AdminFieldsTable';
import AdminMintActionBar from './components/AdminMintActionBar';
import AdminNftDetails from './components/AdminNftDetails';
import AdminReports from './components/AdminReports';
import AdminStats from './components/AdminStats';
import AdminTransactionsHistory from './components/AdminTransactionsHistory';
import PaginationControls from './components/PaginationControls';

const { useBreakpoint } = Grid;

// Constants
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];
const MAX_PAGE_SIZE = 50;

const STATE_FILTER_OPTIONS = [
  { label: 'All', value: 'all' },
  ...(['free', 'reserved', 'sold', 'error'] as AdminStatKey[]).map((status) => ({
    label: getStatLabel(status),
    value: status,
  })),
];

const INITIAL_STATS = {
  total: 0,
  free: 0,
  reserved: 0,
  sold: 0,
  error: 0,
};

const INITIAL_STATE = {
  fieldCount: 1,
  nfts: [] as NFT[],
  balance: 0,
  loading: false,
  stateFilter: 'all',
  page: 1,
  pageSize: 10,
  stats: INITIAL_STATS,
  viewingNft: null as NFTDetails | null,
  transactions: [] as ProjectTransaction[],
  transactionsLoading: false,
  generatedToken: null as string | null,
};

type AdminState = typeof INITIAL_STATE;

const AdminDashboard = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [state, setState] = useState<AdminState>(INITIAL_STATE);

  const {
    selectedRowKeys,
    selectAllReady,
    setSelectedRowKeys,
    setSelectAllReady,
    clearSelection,
    getSelectedCount,
    getAllSelectedNfts,
  } = useSelectionStore();

  const screens = useBreakpoint();
  const modalWidth = screens.md ? '50%' : '90%';

  // ==================== Data Fetching ====================
  const fetchBalance = useCallback(async () => {
    try {
      const response = await MintService.getBalance();
      setState((prev) => ({
        ...prev,
        balance: response.data.data.mintCouponBalanceCardano,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  }, [messageApi]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await MintService.getCounts();
      const { nftTotal, free, reserved, sold, error } = response.data.data;
      setState((prev) => ({
        ...prev,
        stats: { total: nftTotal, free, reserved, sold, error },
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  }, [messageApi]);

  const fetchNfts = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const limitedPageSize = Math.min(state.pageSize, MAX_PAGE_SIZE);
      const response = await MintService.getNfts(state.stateFilter, state.page, limitedPageSize);
      const data = response.data.data;
      setState((prev) => ({ ...prev, nfts: data, loading: false }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [messageApi, state.page, state.pageSize, state.stateFilter]);

  const fetchTransactions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, transactionsLoading: true }));
      const response = await MintService.getTransactions();
      setState((prev) => ({
        ...prev,
        transactions: response.data.data,
        transactionsLoading: false,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      setState((prev) => ({ ...prev, transactionsLoading: false }));
    }
  }, [messageApi]);

  const refresh = async () => {
    await Promise.all([fetchBalance(), fetchStats(), fetchNfts(), fetchTransactions()]);
  };

  // ==================== Effect Hooks ====================
  useEffect(() => {
    fetchBalance();
    fetchStats();
    fetchTransactions();
  }, [fetchBalance, fetchStats, fetchTransactions]);

  useEffect(() => {
    fetchNfts();
  }, [fetchNfts]);

  // ==================== NFT Detail Handlers ====================
  const handleViewNft = async (uid: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await MintService.getNftDetailsById(uid);
      setState((prev) => ({
        ...prev,
        viewingNft: response.data.data,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseNftModal = () => {
    setState((prev) => ({ ...prev, viewingNft: null }));
  };

  // ==================== Minting Handlers ====================
  const handleRandomMint = async () => {
    try {
      const result = await MintService.mintRandomBatch(state.fieldCount);
      const { batches } = result.data.data;
      const totalMinted = batches.reduce(
        (sum: number, batch) =>
          batch.success && batch.result?.sendedNft ? sum + batch.result.sendedNft.length : sum,
        0
      );
      messageApi.success(`Successfully minted ${totalMinted} NFTs`);
      await refresh();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  };

  const handleSelectedMint = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('No NFTs selected for minting');
      return;
    }

    try {
      await MintService.mintSpecificBatch(selectedRowKeys as string[]);
      messageApi.success(`Minted ${selectedRowKeys.length} NFTs`);
      clearSelection();
      await refresh();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  };

  const handleSpecificMint = async (id: string) => {
    try {
      await MintService.mintSpecificBatch([id]);
      messageApi.success('Minted 1 NFT');
      await refresh();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  };

  // ==================== Selection Handlers ====================
  const handleSelectAllReady = () => {
    const newSelectAll = !selectAllReady;
    setSelectAllReady(newSelectAll);

    if (newSelectAll) {
      // Select all NFTs in 'free' state on the current page
      const readyNfts = state.nfts.filter((nft) => nft.state === 'free');
      const readyNftIds = readyNfts.map((nft) => nft.uid);
      setSelectedRowKeys(readyNftIds, readyNfts);
    } else {
      // Deselect all NFTs in 'free' state on the current page
      const currentPageFreeIds = state.nfts
        .filter((nft) => nft.state === 'free')
        .map((nft) => nft.uid);

      const newSelectedKeys = selectedRowKeys.filter(
        (key) => !currentPageFreeIds.includes(String(key))
      );

      const remainingNfts = getAllSelectedNfts().filter(
        (nft) => !currentPageFreeIds.includes(nft.uid)
      );

      setSelectedRowKeys(newSelectedKeys, remainingNfts);
    }
  };

  const handleRowSelection = (keys: React.Key[]) => {
    setSelectedRowKeys(keys, state.nfts);
  };

  // ==================== Pagination Handlers ====================
  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const handleStateFilterChange = (stateFilter: string) => {
    setState((prev) => ({ ...prev, stateFilter, page: 1 }));
  };

  const handleFirstPage = () => handlePageChange(1);
  const handlePreviousPage = () =>
    setState((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }));
  const handleNextPage = () =>
    setState((prev) => ({
      ...prev,
      page: state.nfts.length === state.pageSize ? prev.page + 1 : prev.page,
    }));

  // ==================== Field Count Handler ====================
  const handleFieldCountChange = (value: number | null) => {
    setState((prev) => ({ ...prev, fieldCount: value || 1 }));
  };

  // ==================== Report Handlers ====================
  const handleGenerateReport = async () => {
    try {
      const response = await MintService.generateReport();
      return response.data.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      throw error;
    }
  };

  const handleGetReportStatus = async (reportId: string) => {
    try {
      const response = await MintService.getReportStatus(reportId);
      return response.data.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      throw error;
    }
  };

  const handleDownloadReport = async (reportId: string, type: 'csv' | 'pdf') => {
    try {
      const response = await MintService.getReportStatus(reportId);
      const { status, pdfPath, csvPath } = response.data.data;

      if (status !== 'completed') {
        messageApi.warning(`The ${type.toUpperCase()} report is not ready yet.`);
        return;
      }

      window.open(type === 'pdf' ? pdfPath : csvPath, '_blank');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  };

  const handleGenerateToken = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('No NFTs selected for token generation');
      return;
    }

    try {
      const response = await MintService.generateUserToken(selectedRowKeys as string[]);
      const { token } = response.data;
      setState((prev) => ({ ...prev, generatedToken: token }));
      messageApi.success('Access token generated successfully');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  };

  // ==================== Render Helpers ====================
  const renderWarningAlert = () => (
    <Alert
      message="Warning"
      description="Transactions will be on-chain using the network set by your NMKR API key. Admin mints send NFTs to address defined in the RECEIVER_ADDRESS environment variable."
      type="warning"
      showIcon
      closable
    />
  );

  const renderNftsManagement = () => (
    <Flex vertical gap={16}>
      <AdminMintActionBar
        loading={state.loading}
        balance={state.balance}
        selectAll={selectAllReady}
        hasSelected={getSelectedCount() > 0}
        selectedCount={getSelectedCount()}
        onSelectAllChange={handleSelectAllReady}
        fieldCount={state.fieldCount}
        onFieldCountChange={handleFieldCountChange}
        onMintRandom={handleRandomMint}
        onMintSelected={handleSelectedMint}
        onGenerateToken={handleGenerateToken}
      />

      <PaginationControls
        page={state.page}
        pageSize={state.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        loading={state.loading}
        totalItems={state.stats.total}
        stateFilter={state.stateFilter}
        stateFilterOptions={STATE_FILTER_OPTIONS}
        onFirstPage={handleFirstPage}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
        onPageSizeChange={handlePageSizeChange}
        onStateFilterChange={handleStateFilterChange}
        onRefresh={refresh}
      />

      <AdminFieldsTable
        dataSource={state.nfts}
        onView={handleViewNft}
        onMint={handleSpecificMint}
        selected={{
          selectedRowKeys,
          setSelectedRowKeys: handleRowSelection,
        }}
        loading={state.loading}
      />
    </Flex>
  );

  const renderTransactionHistory = () => (
    <AdminTransactionsHistory data={state.transactions} loading={state.transactionsLoading} />
  );

  const renderReports = () => (
    <AdminReports
      onGenerateReport={handleGenerateReport}
      onDownloadReport={handleDownloadReport}
      onGetStatus={handleGetReportStatus}
    />
  );

  const renderNftDetailsModal = () => (
    <Modal
      title="NFT Details"
      open={!!state.viewingNft}
      onCancel={handleCloseNftModal}
      footer={null}
      width={modalWidth}
    >
      {state.viewingNft && <AdminNftDetails nft={state.viewingNft} />}
    </Modal>
  );

  const renderTokenModal = () => {
    const handleClipboardCopy = () => {
      navigator.clipboard.writeText(state.generatedToken || '');
      messageApi.success('Token copied to clipboard!');
    };

    return (
      <Modal
        title="Generated Access Token"
        open={!!state.generatedToken}
        onCancel={() => setState((prev) => ({ ...prev, generatedToken: null }))}
        footer={null}
      >
        <Input.TextArea
          value={state.generatedToken || ''}
          readOnly
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
        <Button onClick={handleClipboardCopy} className="mt-4">
          Copy to Clipboard
        </Button>
      </Modal>
    );
  };

  const tabItems = [
    {
      key: 'nfts',
      label: 'Field Management',
      children: renderNftsManagement(),
    },
    {
      key: 'transactions',
      label: 'Transaction History',
      children: renderTransactionHistory(),
    },
    {
      key: 'reports',
      label: 'Minting Reports',
      children: renderReports(),
    },
  ];

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      {renderWarningAlert()}
      <AdminStats {...state.stats} />
      <Tabs defaultActiveKey="nfts" items={tabItems} />
      {renderNftDetailsModal()}
      {renderTokenModal()}
    </Flex>
  );
};

export default AdminDashboard;
