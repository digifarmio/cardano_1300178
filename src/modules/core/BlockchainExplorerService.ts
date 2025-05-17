import { ConfigService } from '../../config/config.service';
import { ValidationError } from '../../modules/core/errors';
import { Blockchain, BlockchainType } from '../../types';

export class BlockchainExplorerService {
  private readonly configService: ConfigService;
  private readonly explorers: Record<Blockchain, BlockchainType>;

  constructor() {
    this.configService = new ConfigService();
    this.explorers = {
      Cardano: {
        testnet: 'https://preprod.cardanoscan.io/transaction',
        mainnet: 'https://cardanoscan.io/transaction',
      },
      Solana: {
        testnet: 'https://explorer.solana.com/tx',
        mainnet: 'https://explorer.solana.com/tx',
      },
      Ethereum: {
        testnet: 'https://sepolia.etherscan.io/tx',
        mainnet: 'https://etherscan.io/tx',
      },
    };
  }

  public getExplorerUrl(blockchain: Blockchain, txHash: string): string {
    const network = this.getNetworkType();

    if (!this.explorers[blockchain]) {
      throw new ValidationError(`Unsupported blockchain type: ${blockchain}`);
    }

    const baseUrl = this.explorers[blockchain][network];
    return blockchain === 'Solana'
      ? `${baseUrl}/${txHash}?cluster=${network}`
      : `${baseUrl}/${txHash}`;
  }

  private getNetworkType(): 'mainnet' | 'testnet' {
    return this.configService.baseUrl.includes('studio-api.nmkr.io') ? 'mainnet' : 'testnet';
  }
}
