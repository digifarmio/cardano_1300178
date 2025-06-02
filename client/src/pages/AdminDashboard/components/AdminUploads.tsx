import { Button, Card, Flex, Input, Typography } from 'antd';
import { FolderOutlined, FileTextOutlined, UploadOutlined } from '@ant-design/icons';
import { memo, useState } from 'react';

const { Title, Text } = Typography;

interface AdminUploadsProps {
  onProcessCSV: (nftBucket: string, csvBucket: string) => Promise<void>;
}

const AdminUploads = memo(({ onProcessCSV }: AdminUploadsProps) => {
  const [nftBucket, setNftBucket] = useState('');
  const [csvBucket, setCsvBucket] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const handleProcessCSV = async () => {
    if (!nftBucket || !csvBucket) return;

    setUploadLoading(true);
    try {
      await onProcessCSV(nftBucket, csvBucket);
      setNftBucket('');
      setCsvBucket('');
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <Card variant="borderless">
      <Flex vertical gap={24}>
        <Flex vertical gap={4}>
          <Title level={4} className="!mb-0">
            Process Fields Data
          </Title>
          <Text type="secondary">
            Upload and process fields data by providing the storage bucket names.
          </Text>
        </Flex>

        <Flex vertical gap={16}>
          <Flex vertical gap={4}>
            <Text strong>NFT Bucket Name</Text>
            <Text type="secondary">
              The name of the storage bucket where field images are uploaded.
            </Text>
            <Input
              placeholder="e.g. field-images"
              value={nftBucket}
              onChange={(e) => setNftBucket(e.target.value)}
              prefix={<FolderOutlined className="text-gray-400" />}
              size="large"
            />
          </Flex>

          <Flex vertical gap={4}>
            <Text strong>CSV Bucket Name</Text>
            <Text type="secondary">
              The name of the storage bucket that contains the <code>placeholder.csv</code> file.
            </Text>
            <Input
              placeholder="e.g. field-data"
              value={csvBucket}
              onChange={(e) => setCsvBucket(e.target.value)}
              prefix={<FileTextOutlined className="text-gray-400" />}
              size="large"
            />
          </Flex>
        </Flex>

        <Flex justify="end" gap={8}>
          <Button
            onClick={() => {
              setNftBucket('');
              setCsvBucket('');
            }}
            disabled={uploadLoading}
          >
            Clear
          </Button>
          <Button
            type="primary"
            onClick={handleProcessCSV}
            loading={uploadLoading}
            disabled={!nftBucket || !csvBucket}
            icon={<UploadOutlined />}
          >
            {uploadLoading ? 'Processing...' : 'Upload'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
});

export default AdminUploads;
