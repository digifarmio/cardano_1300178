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
      {/* NFT Title */}
      <Title level={3} className="!mb-0 text-center">
        {nft.displayname || nft.name}
      </Title>

      {/* Field ID */}
      {parsedMetadata && (
        <Text strong className="text-lg text-center">
          Field ID: {parsedMetadata.id_long || parsedMetadata.id}
        </Text>
      )}

      {/* Image Preview */}
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

      {/* Field Data Section */}
      {parsedMetadata && (
        <Card title="Field Data">
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Area">{parsedMetadata.area ?? 'N/A'} m²</Descriptions.Item>
            <Descriptions.Item label="Crop">{parsedMetadata.crop ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Last">{parsedMetadata.last ?? 'N/A'}</Descriptions.Item>
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
            <Descriptions.Item label="Source Projection">
              {parsedMetadata.src_proj ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Center Coordinates">
              {parsedMetadata.center_lat ?? 'N/A'}, {parsedMetadata.center_lng ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Center (Raw)">
              {(parsedMetadata.center ?? []).join(', ') || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Country">{parsedMetadata.country ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Confidence">
              {parsedMetadata.confidence ?? 'N/A'}%
            </Descriptions.Item>
            <Descriptions.Item label="Version">{parsedMetadata.version ?? 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="Vertices">
              {parsedMetadata.number_of_vertices ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Vertices (Simplified)">
              {parsedMetadata.number_of_vertices_simplified ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Vegetation">
              Herbaceous: {parsedMetadata.herbaceous_vegetation ?? 'N/A'}%
              <br />
              Shrubs: {parsedMetadata.shrubs ?? 'N/A'}%
              <br />
              Forest: {parsedMetadata.open_forest ?? 'N/A'}%
            </Descriptions.Item>
            <Descriptions.Item label="Field ID">
              {parsedMetadata.id ?? parsedMetadata.id ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Field ID (Long)">
              {parsedMetadata.id_long ?? parsedMetadata.id ?? 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Metadata Version">
              {parsedMetadata.version ?? 'N/A'}
            </Descriptions.Item>
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
