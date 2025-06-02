import { KeyOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Flex, InputNumber, Space, Tooltip, Typography } from 'antd';

const { Text } = Typography;

interface AdminMintActionBarProps {
  loading?: boolean;
  balance?: number;
  selectAll: boolean;
  hasSelected: boolean;
  selectedCount: number;
  onSelectAllChange: (checked: boolean) => void;
  fieldCount: number;
  onFieldCountChange: (value: number | null) => void;
  onMintRandom: () => void;
  onMintSelected: () => void;
  onGenerateToken: () => void;
}

const AdminMintActionBar = ({
  loading,
  balance,
  selectAll,
  hasSelected,
  selectedCount,
  onSelectAllChange,
  fieldCount,
  onFieldCountChange,
  onMintRandom,
  onMintSelected,
  onGenerateToken,
}: AdminMintActionBarProps) => {
  return (
    <Card variant="borderless">
      <Flex align="center" justify="space-between" gap={16}>
        <Checkbox checked={selectAll} onChange={(e) => onSelectAllChange(e.target.checked)}>
          <Flex align="center" gap={4}>
            <Text>Select All Free</Text>
            <Text type="secondary">({selectedCount})</Text>
          </Flex>
        </Checkbox>

        <Space size="middle" wrap align="center">
          {typeof balance === 'number' && (
            <Text type="secondary">Balance: {balance.toFixed(2)} Mint Coupons</Text>
          )}

          <InputNumber min={1} value={fieldCount} onChange={onFieldCountChange} className="w-20" />
          <span>fields</span>

          <Tooltip title="Mint a random set of fields">
            <Button icon={<PlusCircleOutlined />} onClick={onMintRandom} loading={loading}>
              Mint Random
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<PlusCircleOutlined />}
            onClick={onMintSelected}
            loading={loading}
            disabled={!hasSelected}
          >
            Mint Selected
          </Button>

          <Button
            icon={<KeyOutlined />}
            onClick={onGenerateToken}
            loading={loading}
            disabled={!hasSelected}
          >
            Generate Access Token
          </Button>
        </Space>
      </Flex>
    </Card>
  );
};

export default AdminMintActionBar;
