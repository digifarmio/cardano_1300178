import { CheckOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Flex, InputNumber, Space, Tooltip, Typography } from 'antd';

const { Text } = Typography;

interface AdminMintActionBarProps {
  loading?: boolean;
  selectAll: boolean;
  onSelectAllChange: (checked: boolean) => void;
  fieldCount: number;
  onFieldCountChange: (value: number | null) => void;
  onMintRandom: () => void;
  onMintSelected: () => void;
  balance?: number;
}

const AdminMintActionBar = ({
  loading,
  selectAll,
  onSelectAllChange,
  fieldCount,
  onFieldCountChange,
  onMintRandom,
  onMintSelected,
  balance,
}: AdminMintActionBarProps) => {
  return (
    <Card variant="borderless">
      <Flex align="center" justify="space-between" gap={16}>
        <Checkbox checked={selectAll} onChange={(e) => onSelectAllChange(e.target.checked)}>
          Select All Free
        </Checkbox>

        <Space size="middle" wrap align="center">
          {typeof balance === 'number' && (
            <Text type="secondary">Balance: {balance.toFixed(2)} Mint Coupons</Text>
          )}

          <InputNumber min={1} value={fieldCount} onChange={onFieldCountChange} className="w-20" />
          <span>fields</span>

          <Tooltip title="Mint a random set of fields">
            <Button icon={<SettingOutlined />} onClick={onMintRandom} loading={loading}>
              Mint Random
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={onMintSelected}
            loading={loading}
          >
            Mint Selected
          </Button>
        </Space>
      </Flex>
    </Card>
  );
};

export default AdminMintActionBar;
