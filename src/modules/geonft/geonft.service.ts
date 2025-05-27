import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import csv from 'csvtojson';
import { ConfigService } from '@/config/config.service';
import { AwsClientProvider, AwsClientType } from '@/modules/core/AwsClients';
import { NmkrClient } from '@/modules/core/nmkr.client';
import { APIResponse, UploadFiles, BucketObject, ImageNft } from '@/types';

export class GeoNftService {
  private readonly s3Client: S3Client;

  constructor(
    private readonly configService = new ConfigService(),
    private readonly nmkrClient = new NmkrClient()
  ) {
    this.s3Client = AwsClientProvider.getClient(AwsClientType.S3);
  }

  async process(files: Express.Multer.File[]): Promise<APIResponse> {
    try {
      const projectUid = this.configService.projectUid;
      const bucketItems = await this.getBucketObjects();
      let uploadResponse;

      for (let i = 0; i < files.length; i++) {
        const [response, fileName] = await this.transformNft(files[i]);
        const { mimetype, fileFromBase64 } = response;

        const policyId = this.configService.policyId;
        const cip25Metadata = {
          '721': {
            [policyId]: {
              [fileName]: bucketItems[i],
            },
            version: '1.0',
          },
        };
        const params: UploadFiles = {
          tokenname: fileName,
          previewImageNft: {
            mimetype: mimetype,
            fileFromBase64: fileFromBase64,
          },
          metadataOverride: JSON.stringify(cip25Metadata),
        };
        uploadResponse = await this.nmkrClient.uploadNft(projectUid, params);
      }

      return uploadResponse as APIResponse;
    } catch (error) {
      console.error('Error processing NFT data:', error);
      throw new Error('Failed to process NFT data');
    }
  }

  private async getBucketObjects(): Promise<BucketObject[]> {
    const params = {
      Bucket: this.configService.bucketName,
    };

    try {
      const listCommand = new ListObjectsV2Command(params);
      const listResponse = await this.s3Client.send(listCommand);
      const jsonList = [];

      if (!listResponse.Contents) {
        return [];
      }
      for (const object of listResponse.Contents) {
        if (!object.Key) continue;

        const getCommand = new GetObjectCommand({
          Bucket: this.configService.bucketName,
          Key: object.Key,
        });

        const data = await this.s3Client.send(getCommand);
        const jsonData = await csv().fromStream(data.Body as never);
        jsonList.push(...jsonData);
      }
      return jsonList;
    } catch (error) {
      console.error('Error fetching data from S3:', error);
      throw new Error('Failed to fetch data from S3');
    }
  }

  private async transformNft(file: Express.Multer.File): Promise<[ImageNft, string]> {
    const mimeType = file.mimetype;
    const fullFileName = file.originalname;
    const fileName = fullFileName.split('.').slice(0, -1).join('.');
    const base64 = file.buffer.toString('base64');
    return [
      {
        mimetype: mimeType,
        fileFromBase64: base64,
      } as ImageNft,
      fileName,
    ];
  }
}
