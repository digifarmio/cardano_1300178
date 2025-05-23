import { CheckOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Flex, InputNumber, Space, Tooltip } from 'antd';

interface AdminMintActionBarProps {
  selectAll: boolean;
  onSelectAllChange: (checked: boolean) => void;
  fieldCount: number;
  onFieldCountChange: (value: number | null) => void;
  onMintRandom: () => void;
  onMintSelected: () => void;
}

const AdminMintActionBar = ({
  selectAll,
  onSelectAllChange,
  fieldCount,
  onFieldCountChange,
  onMintRandom,
  onMintSelected,
}: AdminMintActionBarProps) => {
  return (
    <Card variant="borderless">
      <Flex align="center" justify="space-between" gap={16}>
        <Checkbox checked={selectAll} onChange={(e) => onSelectAllChange(e.target.checked)}>
          Select All Ready
        </Checkbox>

        <Space size="middle" wrap>
          <InputNumber min={1} value={fieldCount} onChange={onFieldCountChange} className="w-20" />
          <span>fields</span>

          <Tooltip title="Mint a random set of fields">
            <Button icon={<SettingOutlined />} onClick={onMintRandom}>
              Mint Random
            </Button>
          </Tooltip>

          <Button type="primary" icon={<CheckOutlined />} onClick={onMintSelected}>
            Mint Selected
          </Button>
        </Space>
      </Flex>
    </Card>
  );
};

export default AdminMintActionBar;
