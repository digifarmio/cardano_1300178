import { Alert, Flex, Grid, message, Modal, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import type { NFT, NFTDetails, ProjectTransaction } from '../../lib/types';
import { MintService } from '../../services/mintService';
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
  { label: 'Free', value: 'free' },
  { label: 'Reserved', value: 'reserved' },
  { label: 'Sold', value: 'sold' },
  { label: 'Error', value: 'error' },
];

const INITIAL_STATS = {
  total: 0,
  free: 0,
  reserved: 0,
  sold: 0,
  error: 0,
};

const INITIAL_STATE = {
  selectedRowKeys: [] as React.Key[],
  selectAllReady: false,
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
};

type AdminState = typeof INITIAL_STATE;

const AdminDashboard = () => {
  const screens = useBreakpoint();
  const [messageApi, contextHolder] = message.useMessage();
  const [state, setState] = useState<AdminState>(INITIAL_STATE);

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
      messageApi.error('Failed to fetch balance');
      console.error(error);
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
      messageApi.error('Failed to fetch stats');
      console.error(error);
    }
  }, [messageApi]);

  const fetchNfts = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const limitedPageSize = Math.min(state.pageSize, MAX_PAGE_SIZE);
      const response = await MintService.getNfts(state.stateFilter, state.page, limitedPageSize);
      const data = response.data.data;

      setState((prev) => ({
        ...prev,
        nfts: data,
        selectedRowKeys: prev.selectedRowKeys.filter((key) =>
          data.some((nft: NFT) => nft.uid === key)
        ),
        selectAllReady: false,
        loading: false,
      }));
    } catch (error) {
      messageApi.error('Failed to fetch NFTs');
      console.error(error);
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
      messageApi.error('Failed to fetch transactions');
      console.error(error);
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
      messageApi.error('Failed to fetch NFT details');
      console.error(error);
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
      messageApi.error('Random minting failed');
      console.error(error);
    }
  };

  const handleSelectedMint = async () => {
    if (state.selectedRowKeys.length === 0) {
      messageApi.warning('No NFTs selected for minting');
      return;
    }

    try {
      await MintService.mintSpecificBatch(state.selectedRowKeys as string[]);
      messageApi.success(`Minted ${state.selectedRowKeys.length} NFTs`);
      setState((prev) => ({ ...prev, selectedRowKeys: [], selectAllReady: false }));
      await refresh();
    } catch (error) {
      messageApi.error('Batch minting failed');
      console.error(error);
    }
  };

  const handleSpecificMint = async (id: string) => {
    try {
      await MintService.mintSpecificBatch([id]);
      messageApi.success('Minted 1 NFT');
      await refresh();
    } catch (error) {
      messageApi.error('Minting failed');
      console.error(error);
    }
  };

  // ==================== Selection Handlers ====================
  const handleSelectAllReady = () => {
    setState((prev) => {
      const newSelectAll = !prev.selectAllReady;
      const readyNftIds = newSelectAll
        ? prev.nfts.filter((nft) => nft.state === 'free').map((nft) => nft.uid)
        : [];
      return {
        ...prev,
        selectAllReady: newSelectAll,
        selectedRowKeys: readyNftIds,
      };
    });
  };

  const handleRowSelection = (keys: React.Key[]) => {
    setState((prev) => ({ ...prev, selectedRowKeys: keys }));
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

  // ==================== Transaction Handlers ====================
  const handleDownloadTransaction = (transaction: ProjectTransaction) => {
    const csvContent = [
      [
        'Transaction ID',
        'Date',
        'Blockchain',
        'Status',
        'NFT Count',
        'Amount (ADA)',
        'Fee (ADA)',
        'Confirmed',
      ].join(','),
      [
        transaction.transactionid,
        new Date(transaction.created).toISOString(),
        transaction.blockchain,
        transaction.state,
        transaction.nftcount,
        transaction.ada,
        transaction.fee,
        transaction.confirmed ? 'Yes' : 'No',
      ].join(','),
      '\nNFT Details (Asset Name|Fingerprint|Token Count|Multiplier|Status|Transaction Hash)',
      transaction.transactionNfts
        ?.map(
          (nft) =>
            `${nft.assetName}|${nft.fingerprint}|${nft.tokenCount}|${nft.multiplier}|${nft.confirmed ? 'CONFIRMED' : 'PENDING'}|${nft.txHashSolanaTransaction || 'N/A'}`
        )
        .join('\n') || 'No NFT details',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `transaction_${transaction.transactionid}_${new Date(transaction.created).toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ==================== Report Handlers ====================
  const handleGenerateReport = async () => {
    try {
      const response = await MintService.generateReport();
      return response.data.data;
    } catch (error) {
      messageApi.error('Failed to generate report');
      throw error;
    }
  };

  const handleGetReportStatus = async (reportId: string) => {
    try {
      const response = await MintService.getReportStatus(reportId);
      return response.data.data;
    } catch (error) {
      messageApi.error('Failed to get report status');
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
      messageApi.error(`Failed to download ${type.toUpperCase()} report`);
      console.error(error);
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
        selectAll={state.selectAllReady}
        onSelectAllChange={handleSelectAllReady}
        fieldCount={state.fieldCount}
        onFieldCountChange={handleFieldCountChange}
        onMintRandom={handleRandomMint}
        onMintSelected={handleSelectedMint}
        balance={state.balance}
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
          selectedRowKeys: state.selectedRowKeys,
          setSelectedRowKeys: handleRowSelection,
        }}
        loading={state.loading}
      />
    </Flex>
  );

  const renderTransactionHistory = () => (
    <AdminTransactionsHistory
      data={state.transactions}
      onDownload={handleDownloadTransaction}
      loading={state.transactionsLoading}
    />
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
    </Flex>
  );
};

export default AdminDashboard;
