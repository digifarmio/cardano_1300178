import { Card, Flex, Statistic } from 'antd';
import { getStatColor, getStatLabel } from '../../../lib/statusMapper';

interface AdminStatsProps {
  total: number;
  free: number;
  reserved: number;
  sold: number;
  error: number;
}

const AdminStats = ({ total, free, reserved, sold, error }: AdminStatsProps) => {
  const stats = { total, sold, free, reserved, error };

  return (
    <Flex align="center" justify="space-between" wrap="wrap" gap={16} className="w-full">
      {Object.entries(stats).map(([key, value]) => (
        <Card key={key} variant="borderless" className="min-w-[160px] flex-1">
          <Statistic
            title={getStatLabel(key as keyof typeof stats)}
            value={value}
            valueStyle={{ color: getStatColor(key as keyof typeof stats) }}
          />
        </Card>
      ))}
    </Flex>
  );
};

export default AdminStats;
