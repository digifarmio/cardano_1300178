import { Card, Descriptions, Flex, Grid, Image, Typography } from 'antd';
import type { NFTDetails } from '../../../lib/types';
import { parseMetadata } from '../../../lib/utils';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface UserNftDetailsProps {
  nft: NFTDetails;
}

const UserNftDetails = ({ nft }: UserNftDetailsProps) => {
  const parsedMetadata = parseMetadata(nft.metadata);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  return (
    <Flex vertical gap={24}>
      <Title level={3} className="!mb-0 text-center">
        {nft.displayname || nft.name}
      </Title>

      {parsedMetadata && (
        <Text strong className="text-lg text-center">
          Field ID: {parsedMetadata.id_long || parsedMetadata.id}
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

      {parsedMetadata && (
        <Card title="Field Data">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Area">{parsedMetadata.area ?? 'N/A'} m²</Descriptions.Item>
            <Descriptions.Item label="Crop">{parsedMetadata.crop ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {parsedMetadata.last ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tile">{parsedMetadata.tile ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Dates">
              {(parsedMetadata.dates ?? []).join(', ') || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Sustainability Index">
              {parsedMetadata.SustInd ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Flatness">
              {parsedMetadata.flatness ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Perimeter">
              {parsedMetadata.perimeter ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Exterior Area">
              {parsedMetadata.exterior_area ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Center Coordinates">
              {parsedMetadata.center_lat ?? 'N/A'}, {parsedMetadata.center_lng ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Country">{parsedMetadata.country ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Confidence">
              {parsedMetadata.confidence ?? 'N/A'}%
            </Descriptions.Item>
            <Descriptions.Item label="Vegetation">
              Herbaceous: {parsedMetadata.herbaceous_vegetation ?? 'N/A'}%<br />
              Shrubs: {parsedMetadata.shrubs ?? 'N/A'}%<br />
              Forest: {parsedMetadata.open_forest ?? 'N/A'}%
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="NFT Info">
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="NFT ID">{nft.uid}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Text strong>{nft.state}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Minted">{nft.minted ? 'Yes' : 'No'}</Descriptions.Item>

          {nft.minted && (
            <>
              <Descriptions.Item label="Minted On">{nft.mintedOnBlockchain}</Descriptions.Item>
              <Descriptions.Item label="Policy ID">{nft.policyid}</Descriptions.Item>
              <Descriptions.Item label="Asset ID">{nft.assetid}</Descriptions.Item>
              <Descriptions.Item label="Fingerprint">{nft.fingerprint}</Descriptions.Item>
            </>
          )}

          <Descriptions.Item label="IPFS Hash">{nft.ipfshash}</Descriptions.Item>
          {nft.selldate && (
            <Descriptions.Item label="Sell Date">
              {new Date(nft.selldate).toLocaleString()}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </Flex>
  );
};

export default UserNftDetails;
