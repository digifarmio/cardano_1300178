import { Alert, Flex, Grid, message, Modal } from 'antd';
import { useEffect, useState } from 'react';
import { MintService } from '../../services/mintService';
import type { NFTDetails } from '../../lib/types';
import UserFieldsTable from './components/UserFieldsTable';
import { useAuth } from '../../hooks/useAuth';
import UserNftDetails from './components/UserNftDetails';
import { getErrorMessage } from '../../lib/errorHandler';

const { useBreakpoint } = Grid;

const UserDashboard = () => {
  const { token } = useAuth();
  const [nfts, setNfts] = useState<NFTDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingNft, setViewingNft] = useState<NFTDetails | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const screens = useBreakpoint();
  const modalWidth = screens.md ? '50%' : '90%';

  useEffect(() => {
    const fetchUserNfts = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const response = await MintService.getUserNfts();
        setNfts(response.data.data);
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        messageApi.error(errorMessage);
        console.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNfts();
  }, [token, messageApi]);

  const handleView = async (uid: string) => {
    try {
      const nft = nfts.find((nft) => nft.uid === uid);
      if (nft) {
        setViewingNft(nft);
      } else {
        messageApi.warning('NFT not found.');
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      messageApi.error(errorMessage);
      console.error(errorMessage);
    }
  };

  const handleClaim = () => {
    // Disabled for now
    messageApi.warning('Claim functionality coming soon!');
  };

  const handleCloseNftModal = () => {
    setViewingNft(null);
  };

  return (
    <Flex vertical gap={24}>
      {contextHolder}
      <Alert
        message="Warning"
        description="Transactions will be on-chain. Network is set by your NMKR API key."
        type="warning"
        showIcon
        closable
      />

      <UserFieldsTable
        dataSource={nfts}
        loading={loading}
        onView={handleView}
        onClaim={handleClaim}
      />

      {viewingNft && (
        <Modal
          title="NFT Details"
          open={!!viewingNft}
          onCancel={handleCloseNftModal}
          footer={null}
          width={modalWidth}
        >
          <UserNftDetails nft={viewingNft} />
        </Modal>
      )}
    </Flex>
  );
};

export default UserDashboard;
