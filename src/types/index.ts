export type BlockchainType = 'Cardano' | 'Solana' | 'Ethereum';

/**
 * Cardano NFT Metadata Structure for Field NFTs
 * Following CIP-25 standard for NFT metadata
 */
export interface CIP25Metadata {
  '721': {
    [policyId: string]: {
      [assetName: string]: FieldData;
    } & {
      version: string;
    };
  };
}

export interface FieldData {
  name: string;
  image: string;
  mediaType: string;
  description: string;
  version: string;
  area: string;
  crop: string;
  last: string;
  tile: string;
  dates: string;
  SustInd: string;
  country: string;
  flatness: string;
  src_proj: string;
  perimeter: string;
  center_lat: string;
  center_lng: string;
  confidence: string;
  exterior_area: string;
  number_of_vertices: string;
  number_of_vertices_simplified: string;
  herbaceous_vegetation: string;
  shrubs: string;
  open_forest: string;
  id: string;
  id_long: string;
  center: string;
  files: Array<{
    name: string;
    mediaType: string;
    src: string;
  }>;
}

export interface PlaceholderCSV extends FieldData {
  file_name: string;
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
