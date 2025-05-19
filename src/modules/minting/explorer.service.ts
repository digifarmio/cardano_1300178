import { ConfigService } from '@/config/config.service';
import { ValidationError } from '@/modules/core/errors';
import { Blockchain, BlockchainType } from '@/types';

export class ExplorerService {
  private readonly explorers: Record<Blockchain, BlockchainType> = {
    Cardano: {
      testnet: 'https://preprod.cardanoscan.io/transaction',
      mainnet: 'https://cardanoscan.io/transaction',
    },
  };

  constructor(private readonly configService = new ConfigService()) {}

  getExplorerUrl(blockchain?: Blockchain, txHash?: string): string {
    if (!blockchain || !txHash) return 'N/A';
    const explorer = this.explorers[blockchain];
    if (!explorer) throw new ValidationError(`Unsupported blockchain type: ${blockchain}`);
    return `${explorer[this.getNetworkType()]}/${txHash}`;
  }

  private getNetworkType(): 'mainnet' | 'testnet' {
    return this.configService.baseUrl.includes('studio-api.nmkr.io') ? 'mainnet' : 'testnet';
  }
}
