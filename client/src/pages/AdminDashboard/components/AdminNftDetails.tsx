import { Card, Descriptions, Image, Space, Typography } from 'antd';
import type { NFTDetails } from '../../../lib/types';
import { parseMetadata } from '../../../lib/utils';

const { Title, Text } = Typography;

interface AdminNftDetailsProps {
  nft: NFTDetails;
}

const AdminNftDetails = ({ nft }: AdminNftDetailsProps) => {
  const parsedMetadata = parseMetadata(nft.metadata);

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3}>{nft.displayname || nft.name}</Title>

        {/* Safely render id_long if parsedMetadata exists */}
        {parsedMetadata ? (
          <Title level={5}>Field ID Long: {parsedMetadata.id_long}</Title>
        ) : (
          <Text type="warning">Metadata parsing failed or no metadata</Text>
        )}

        {nft.ipfshash && (
          <Image
            src={`${nft.ipfsGatewayAddress || 'https://ipfs.io/ipfs/'}${nft.ipfshash}`}
            alt={nft.displayname || nft.name}
            style={{ maxWidth: '400px', maxHeight: '400px' }}
            placeholder={
              <Image
                preview={false}
                src="https://via.placeholder.com/400?text=Loading+Image"
                width={400}
              />
            }
          />
        )}

        <Descriptions bordered column={1}>
          <Descriptions.Item label="ID">{nft.uid}</Descriptions.Item>
          <Descriptions.Item label="State">
            <Text strong>{nft.state}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{nft.title}</Descriptions.Item>
          <Descriptions.Item label="Series">{nft.series}</Descriptions.Item>
          <Descriptions.Item label="Minted">{nft.minted ? 'Yes' : 'No'}</Descriptions.Item>
          {nft.minted && (
            <>
              <Descriptions.Item label="Minted On">{nft.mintedOnBlockchain}</Descriptions.Item>
              <Descriptions.Item label="Policy ID">{nft.policyid}</Descriptions.Item>
              <Descriptions.Item label="Asset ID">{nft.assetid}</Descriptions.Item>
              <Descriptions.Item label="Fingerprint">{nft.fingerprint}</Descriptions.Item>
              <Descriptions.Item label="Mint TX Hash">{nft.initialminttxhash}</Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="IPFS Hash">{nft.ipfshash}</Descriptions.Item>
          {nft.selldate && (
            <Descriptions.Item label="Sell Date">
              {new Date(nft.selldate).toLocaleString()}
            </Descriptions.Item>
          )}
          {nft.soldby && <Descriptions.Item label="Sold By">{nft.soldby}</Descriptions.Item>}
          {nft.receiveraddress && (
            <Descriptions.Item label="Receiver Address">{nft.receiveraddress}</Descriptions.Item>
          )}
          {nft.metadata && (
            <Descriptions.Item label="Metadata">
              <Text code style={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(JSON.parse(nft.metadata), null, 2)}
              </Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Space>
    </Card>
  );
};

export default AdminNftDetails;
