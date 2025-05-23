import { Card, Col, Row, Statistic } from 'antd';

interface AdminStatsProps {
  totalFields: number;
  mintedNFTs: number;
  readyToMint: number;
  processing: number;
}

const AdminStats = ({ totalFields, mintedNFTs, readyToMint, processing }: AdminStatsProps) => {
  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={12} lg={6}>
        <Card variant="borderless">
          <Statistic title="Total Fields" value={totalFields} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={12} lg={6}>
        <Card variant="borderless">
          <Statistic title="Minted NFTs" value={mintedNFTs} valueStyle={{ color: '#3f8600' }} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={12} lg={6}>
        <Card variant="borderless">
          <Statistic title="Ready To Mint" value={readyToMint} valueStyle={{ color: '#1890ff' }} />
        </Card>
      </Col>

      <Col xs={24} sm={12} md={12} lg={6}>
        <Card variant="borderless">
          <Statistic title="Processing" value={processing} valueStyle={{ color: '#faad14' }} />
        </Card>
      </Col>
    </Row>
  );
};

export default AdminStats;
