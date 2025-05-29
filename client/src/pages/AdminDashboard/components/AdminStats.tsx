import { Card, Flex, Statistic } from 'antd';

interface AdminStatsProps {
  total: number;
  free: number;
  reserved: number;
  sold: number;
  error: number;
}

const AdminStats = ({ total, free, reserved, sold, error }: AdminStatsProps) => {
  return (
    <Flex align="center" justify="space-between" wrap="wrap" gap={16} className="w-full">
      <Card variant="borderless" className="min-w-[160px] flex-1">
        <Statistic title="Total Fields" value={total} />
      </Card>
      <Card variant="borderless" className="min-w-[160px] flex-1">
        <Statistic title="Free" value={free} valueStyle={{ color: 'blue' }} />
      </Card>
      <Card variant="borderless" className="min-w-[160px] flex-1">
        <Statistic title="Reserved" value={reserved} valueStyle={{ color: 'orange' }} />
      </Card>
      <Card variant="borderless" className="min-w-[160px] flex-1">
        <Statistic title="Sold" value={sold} valueStyle={{ color: 'green' }} />
      </Card>
      <Card variant="borderless" className="min-w-[160px] flex-1">
        <Statistic title="Error" value={error} valueStyle={{ color: 'red' }} />
      </Card>
    </Flex>
  );
};

export default AdminStats;
