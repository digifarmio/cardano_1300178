export type BlockchainType = 'Cardano' | 'Solana' | 'Ethereum';

/**
 * Cardano NFT Metadata Structure for Field NFTs
 * Following CIP-25 standard for NFT metadata
 */
export interface CIP25Metadata {
  '721': {
    [policyId: string]: {
      [assetName: string]: unknown;
    } & {
      version: string;
    };
  };
}

export interface BucketObject {
  [key: string]: unknown;
}

export interface CsvHeaders {
  [key: string]: string;
}

export interface GetNftsParams {
  projectUid: string;
  state: string;
  count: number;
  page: number;
}

export interface BatchMintParams {
  projectUid: string;
  count?: string;
  receiver: string;
  blockchain: BlockchainType;
}

export interface BatchMintRequest {
  reserveNfts: {
    lovelace: number;
    nftUid: string;
    tokencount: number;
  }[];
}

/**
 * NMKR API Response Interface for all service responses
 */
export interface APIResponse<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Mint Coupon Balance Response
 */
export interface MintCouponBalanceResponse {
  balance: number;
}

/**
 * Sale Conditions Response
 */
export interface SaleConditionsResponse {
  conditionsMet: boolean;
}

/**
 * NFT Project Details Response
 */
export interface NftProjectDetails {
  id: number;
  projectname: string;
  projecturl: string | null;
  projectLogo: string | null;
  state: string | null;
  free: number;
  sold: number;
  reserved: number;
  total: number;
  blocked: number;
  totalBlocked: number;
  totalTokens: number;
  error: number;
  unknownOrBurnedState: number;
  uid: string;
  maxTokenSupply: number;
  description: string | null;
  addressReservationTime: number;
  policyId: string;
  enableCrossSaleOnPaymentGateway: boolean;
  adaPayoutWalletAddress: string;
  usdcPayoutWalletAddress: string | null;
  enableFiatPayments: boolean;
  paymentGatewaySaleStart: string | null;
  enableDecentralPayments: boolean;
  policyLocks: string;
  royaltyAddress: string | null;
  royaltyPercent: number | null;
  lockslot: number;
  disableManualMintingbutton: boolean;
  disableRandomSales: boolean;
  disableSpecificSales: boolean;
  twitterHandle: string | null;
  nmkrAccountOptions: string;
  crossmintCollectiondId: string | null;
  created: string;
  blockchains: BlockchainType[];
  solanaProjectDetails: SolanaProjectDetails | null;
  aptosProjectDetails: AptosProjectDetails | null;
  solanaPayoutWalletAddress: string | null;
}

export interface SolanaProjectDetails {
  symbol: string;
  collectionFamily: string;
  collectionimage: string;
  sellerFeeBasisPoints: number;
}

export interface AptosProjectDetails {
  collectionImage: string;
  collectionName: string;
}

export interface ImageNft {
  mimetype: string;
  fileFromBase64: string;
}

export interface UploadFiles {
  tokenname: string;
  previewImageNft: ImageNft;
  metadataOverride: string;
}
