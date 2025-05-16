import { GetObjectCommand, S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { AwsClientProvider, AwsClientType } from '../../utils/aws_clients';
import { ConfigService } from '../../config/config.service';
import csv from 'csvtojson';
import { NmkrClient } from '../core/nmkr.client';
import { APIResponse, BucketObject, ImageNft, UploadFiles } from '../../types';
import { v4 as uuidv4 } from 'uuid';

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
      console.log('Processing files:', files);
      const projectUid = this.configService.projectUid;
      const bucketItems = await this.getBucketObjects();
      let uploadResponse;

      for (let i = 0; i < files.length; i++) {
        const uuid = uuidv4().substring(0, 8);
        const response = await this.transformNft(files[i]);
        const { mimetype, fileFromBase64 } = response;

        const policyId = '71108a77295b6e85404e1d3b6427e47d0a68b62fbbaaf9a6092d917c';
        const cip25Metadata = {
          '721': {
            [policyId]: {
              [uuid]: bucketItems[i],
            },
            version: '1.0',
          },
        };
        const params: UploadFiles = {
          tokenname: uuid,
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

  private async transformNft(file: Express.Multer.File): Promise<ImageNft> {
    const mimeType = file.mimetype;
    const base64 = file.buffer.toString('base64');
    return {
      mimetype: mimeType,
      fileFromBase64: base64,
    } as ImageNft;
  }
}
