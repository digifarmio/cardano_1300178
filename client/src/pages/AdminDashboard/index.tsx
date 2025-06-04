import { Button, Flex, Grid, Input, message, Modal, Tabs } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../../lib/errorHandler';
import { getStatLabel } from '../../lib/statusMapper';
import type {
  AdminStatKey,
  NFT,
  NFTDetails,
  ProjectTransaction,
  ReportStatus,
} from '../../lib/types';
import { MintService } from '../../services/mintService';
import { useSelectionStore } from '../../stores/selectionStore';
import AdminFieldsTable from './components/AdminFieldsTable';
import AdminMintActionBar from './components/AdminMintActionBar';
import AdminNftDetails from './components/AdminNftDetails';
import AdminReports from './components/AdminReports';
import AdminStats from './components/AdminStats';
import AdminTransactionsHistory from './components/AdminTransactionsHistory';
import PaginationControls from './components/PaginationControls';
import { CopyOutlined } from '@ant-design/icons';
import { UploadsService } from '../../services/uploadsService';
import AdminUploads from './components/AdminUploads';

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
  reports: {
    data: [] as ReportStatus[],
    loading: false,
    generating: false,
    deleting: null as string | null,
    downloading: null as string | null,
  },
};

type AdminState = typeof INITIAL_STATE;

const AdminDashboard = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [state, setState] = useState<AdminState>(INITIAL_STATE);

  const {
    selectedRowKeys,
    setSelectedRowKeys,
    selectAllReady,
    setSelectAllReady,
    clearSelection,
    getSelectedCount,
    getAllSelectedNfts,
  } = useSelectionStore();

  const screens = useBreakpoint();
  const modalWidth = screens.md ? '50%' : '90%';

  // ==================== Data Fetching ====================
  const fetchAllData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, transactionsLoading: true }));

      const [balanceRes, countsRes, nftsRes, transactionsRes, reportsRes] = await Promise.all([
        MintService.getBalance(),
        MintService.getCounts(),
        MintService.getNfts(state.stateFilter, state.page, Math.min(state.pageSize, MAX_PAGE_SIZE)),
        MintService.getTransactions(),
        MintService.getAllReports(),
      ]);

      setState((prev) => ({
        ...prev,
        balance: balanceRes.data.data.mintCouponBalanceCardano,
        stats: {
          total: countsRes.data.data.nftTotal,
          free: countsRes.data.data.free,
          reserved: countsRes.data.data.reserved,
          sold: countsRes.data.data.sold,
          error: countsRes.data.data.error,
        },
        nfts: nftsRes.data.data,
        transactions: transactionsRes.data.data,
        reports: {
          ...prev.reports,
          data: reportsRes.data.data,
          loading: false,
        },
        loading: false,
        transactionsLoading: false,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      setState((prev) => ({
        ...prev,
        loading: false,
        transactionsLoading: false,
      }));
    }
  }, [messageApi, state.stateFilter, state.page, state.pageSize]);

  const refresh = async () => {
    await fetchAllData();
  };

  const refreshReports = async () => {
    try {
      setState((prev) => ({
        ...prev,
        reports: { ...prev.reports, loading: true },
      }));

      const reportsRes = await MintService.getAllReports();

      setState((prev) => ({
        ...prev,
        reports: {
          ...prev.reports,
          data: reportsRes.data.data,
          loading: false,
        },
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      setState((prev) => ({
        ...prev,
        reports: { ...prev.reports, loading: false },
      }));
    }
  };

  // ==================== Effect Hooks ====================
  useEffect(() => {
    const loadData = async () => {
      await fetchAllData();
    };
    loadData();
  }, [fetchAllData]);

  // ==================== NFT Detail Handlers ====================
  const handleViewNft = async (uid: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await MintService.getNftDetailsById(uid);
      setState((prev) => ({
        ...prev,
        viewingNft: response.data.data,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleCloseNftModal = () => {
    setState((prev) => ({ ...prev, viewingNft: null }));
  };

  // ==================== Minting Handlers ====================
  const handleRandomMint = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const result = await MintService.mintRandom(state.fieldCount);
      const totalMinted = result.data.data.sendedNft.length;
      messageApi.success(`Successfully minted ${totalMinted} NFTs`);
      await refresh();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSelectedMint = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('No NFTs selected for minting');
      return;
    }

    const selectedNfts = getAllSelectedNfts();
    const nonFreeNfts = selectedNfts.filter((nft) => nft.state !== 'free');

    if (nonFreeNfts.length > 0) {
      messageApi.warning(`Cannot mint ${nonFreeNfts.length} NFTs — not ready to be minted.`);
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));
      await MintService.mintSpecific(selectedRowKeys as string[]);
      messageApi.success(`Minted ${selectedRowKeys.length} NFTs`);
      clearSelection();
      await refresh();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleSpecificMint = async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await MintService.mintSpecific([id]);
      messageApi.success('Minted 1 NFT');
      await refresh();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
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

  const handleFirstPage = () => {
    return handlePageChange(1);
  };

  const handlePreviousPage = () => {
    return setState((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }));
  };

  const handleNextPage = () => {
    return setState((prev) => ({
      ...prev,
      page: state.nfts.length === state.pageSize ? prev.page + 1 : prev.page,
    }));
  };

  // ==================== Field Count Handler ====================
  const handleFieldCountChange = (value: number | null) => {
    setState((prev) => ({ ...prev, fieldCount: Number(value) }));
  };

  // ==================== Report Handlers ====================
  const handleGenerateReport = async () => {
    try {
      setState((prev) => ({ ...prev, reports: { ...prev.reports, generating: true } }));
      const response = await MintService.generateReport();
      messageApi.success(`Report ${response.data.data.reportId} started`);
      await refreshReports();
      return response.data.data;
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      throw error;
    } finally {
      setState((prev) => ({ ...prev, reports: { ...prev.reports, generating: false } }));
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      setState((prev) => ({ ...prev, reports: { ...prev.reports, downloading: reportId } }));
      const response = await MintService.getReportById(reportId);
      const { status, csvPath } = response.data.data;

      if (status !== 'completed') {
        messageApi.warning(`The report is not ready yet.`);
        return;
      }

      if (!csvPath) {
        messageApi.error(`No path found for this report.`);
        return;
      }

      const link = document.createElement('a');
      link.href = csvPath;
      link.download = `${reportId}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
      throw error;
    } finally {
      setState((prev) => ({ ...prev, reports: { ...prev.reports, downloading: null } }));
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      setState((prev) => ({ ...prev, reports: { ...prev.reports, deleting: reportId } }));
      await MintService.deleteReport(reportId);
      messageApi.success('Report deleted successfully');
      await refreshReports();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, reports: { ...prev.reports, deleting: null } }));
    }
  };

  const handleGenerateToken = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('No NFTs selected for token generation');
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await MintService.generateUserToken(selectedRowKeys as string[]);
      const { token } = response.data;
      setState((prev) => ({ ...prev, generatedToken: token }));
      messageApi.success('Access token generated successfully');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleProcessCSV = useCallback(
    async (nftBucket: string, csvBucket: string) => {
      try {
        await UploadsService.processCSV(nftBucket, csvBucket);
        messageApi.success('Fields processing started successfully');
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        messageApi.error(errorMessage);
        console.error(errorMessage);
        throw error;
      }
    },
    [messageApi]
  );

  // ==================== Render Helpers ====================
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
        selectedRowKeys={selectedRowKeys}
        onRowSelection={handleRowSelection}
        loading={state.loading}
      />
    </Flex>
  );

  const renderTransactionHistory = () => (
    <AdminTransactionsHistory data={state.transactions} loading={state.transactionsLoading} />
  );

  const renderReports = () => (
    <AdminReports
      reports={state.reports.data}
      loading={{
        list: state.reports.loading,
        generate: state.reports.generating,
        download: state.reports.downloading !== null,
        delete: state.reports.deleting !== null,
      }}
      deletingId={state.reports.deleting}
      downloadingId={state.reports.downloading}
      onGenerateReport={handleGenerateReport}
      onDownloadReport={handleDownloadReport}
      onDeleteReport={handleDeleteReport}
      onRefresh={refreshReports}
    />
  );

  const renderUploads = useCallback(
    () => <AdminUploads onProcessCSV={handleProcessCSV} />,
    [handleProcessCSV]
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
        <Button onClick={handleClipboardCopy} className="mt-4" icon={<CopyOutlined />}>
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
    {
      key: 'uploads',
      label: 'Uploads',
      children: renderUploads(),
    },
  ];

  return (
    <Flex vertical gap={16}>
      {contextHolder}
      <AdminStats {...state.stats} />
      <Tabs defaultActiveKey="nfts" items={tabItems} />
      {renderNftDetailsModal()}
      {renderTokenModal()}
    </Flex>
  );
};

export default AdminDashboard;
