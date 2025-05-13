export type BlockchainType = 'Cardano' | 'Solana' | 'Ethereum';

export interface NmkrConfig {
  apiKey: string;
  baseUrl: string;
  customerId: string;
  walletAddress: string;
}

export interface NmkrProject {
  projectUid: string;
  policyId: string;
}

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
  // Static fields
  version: string;
  // Dynamic fields
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
  // Sub-files
  files: Array<{
    name: string;
    mediaType: string;
    src: string;
  }>;
}

export interface PlaceholderCSV extends FieldData {
  file_name: string;
}

export interface GetAllUploadedFilesParams {
  customerId: string;
  maxCount: number;
  page: number;
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

export interface BatchMintResponse {
  error: string;
  success: string;
  data: unknown;
}

// TODO:
export interface UploadedFile {
  id: string;
  name: string;
}

export interface MintingOptions {
  projectUid: string;
  totalToMint: number;
  startIndex: number;
  receiver: string;
  batchSize: number;
  blockchain?: 'Cardano' | 'Ethereum' | 'Solana';
}

export interface MintingResult {
  success: boolean;
  nftUid?: string;
  transactionId?: string;
  error?: string;
}

export interface MintAndSendResult {
  transactionId: string;
  mintedNfts: {
    nftUid: string;
    tokenName: string;
  }[];
}
