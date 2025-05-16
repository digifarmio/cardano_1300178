#!/usr/bin/env ts-node

import * as dotenv from 'dotenv';
dotenv.config({ path: `${__dirname}/../.env` });

import { ConfigService } from './config/config.service';
import { MintService } from './modules/minting/mint.service';
import { BatchMintParams } from './types';

class MintRandomScript {
  private readonly config: ConfigService;
  private readonly mintService: MintService;

  constructor() {
    this.config = new ConfigService();
    this.mintService = new MintService();
  }

  async run(): Promise<void> {
    try {
      console.log('Starting batch mint process...');

      console.log('Environment verification:');
      console.log('- Project UID:', this.config.projectUid ? '✅' : '❌');
      console.log('- Receiver Address:', this.config.receiverAddress ? '✅' : '❌');
      console.log('- API Key:', this.config.apiKey ? '✅' : '❌');

      const params: BatchMintParams = {
        projectUid: this.config.projectUid,
        receiver: this.config.receiverAddress,
        count: this.config.mintTotalCount,
        blockchain: this.config.blockchain,
      };

      console.log('Minting parameters:', params);

      const result = await this.mintService.mintRandomBatch(params);

      console.log('Batch mint successful!');
      console.log('Result:', result);

      process.exit(0);
    } catch (error) {
      console.error('❌ Batch mint failed:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }
}

new MintRandomScript().run();
