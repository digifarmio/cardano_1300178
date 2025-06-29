import { Card, Descriptions, Flex, Grid, Image, Tag, Typography } from 'antd';
import { getStatColor, getStatLabel } from '../../../lib/statusMapper';
import type { NFTDetails } from '../../../lib/types';
import { parseMetadata } from '../../../lib/utils';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface AdminNftDetailsProps {
  nft: NFTDetails;
}

const AdminNftDetails = ({ nft }: AdminNftDetailsProps) => {
  const parsedMetadata = parseMetadata(nft.metadata);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Flex vertical gap={24} className="p-2">
      <Title level={3} className="!mb-0 text-center">
        {nft.displayname || nft.name}
      </Title>

      {parsedMetadata && (
        <Text strong className="text-lg text-center">
          Field ID:{' '}
          {typeof parsedMetadata.production_id === 'string'
            ? parsedMetadata.production_id
            : typeof parsedMetadata.id === 'string'
              ? parsedMetadata.id
              : 'N/A'}
        </Text>
      )}

      {nft.ipfsGatewayAddress && (
        <Flex justify="center" className="my-4">
          <Image
            src={nft.ipfsGatewayAddress}
            alt={nft.displayname || nft.name}
            width={isMobile ? 200 : 250}
            height={isMobile ? 200 : 250}
            className="rounded-lg border border-gray-200"
            preview={{
              maskClassName: 'rounded-lg',
              src: nft.ipfsGatewayAddress,
            }}
          />
        </Flex>
      )}

      {/* Dynamic Metadata Details*/}
      {parsedMetadata && (
        <Card title="Field Data">
          <Descriptions bordered column={1} size="small">
            {Object.entries(parsedMetadata).map(([key, value]) => {
              if (key === 'files') return;
              return (
                <Descriptions.Item key={key} label={key}>
                  {Array.isArray(value)
                    ? value.join(', ')
                    : typeof value === 'object' && value !== null
                      ? JSON.stringify(value)
                      : String(value)}
                </Descriptions.Item>
              );
            })}
          </Descriptions>
        </Card>
      )}

      {/* NFT Technical Details */}
      <Card title="NFT Technical Details">
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="ID">{nft.uid}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatColor(nft.state)}>{getStatLabel(nft.state)}</Tag>
          </Descriptions.Item>
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

          {nft.receiveraddress && (
            <Descriptions.Item label="Receiver Address">
              <Text copyable>{nft.receiveraddress}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </Flex>
  );
};

export default AdminNftDetails;
