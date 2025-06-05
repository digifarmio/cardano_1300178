import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

// ==================== Blockchain Types ====================
export type Blockchain = 'Cardano';

export interface BlockchainType {
  testnet: string;
  mainnet: string;
}

export interface BlockchainInfo {
  name: string;
  symbol: string;
  network: string;
}

// ==================== CIP-25 Metadata ====================
export interface CIP25Metadata {
  '721': {
    [policyId: string]: {
      [assetName: string]: unknown;
    };
  };
}

// ==================== Common Interfaces ====================
export interface APIResponse<T = unknown> {
  success: boolean;
  error?: string | string[];
  data?: T;
}

export interface NFT {
  assetName: string;
  fingerprint?: string;
  tokenCount: number;
  multiplier: number;
  txHashSolanaTransaction?: string;
  confirmed: boolean;
  id: number;
  uid: string;
  name: string;
  displayname: string;
  detaildata: string;
  ipfsLink: string;
  gatewayLink: string;
  state: string;
  minted: boolean;
  policyId: string;
  assetId: string;
  initialMintTxHash: string;
  series: string;
  price: number;
  selldate: string;
  paymentGatewayLinkForSpecificSale: string;
  priceSolana: number;
  priceAptos: number;
}

// ==================== Minting Interfaces ====================
export interface GetNftsParams {
  projectUid: string;
  state: string;
  count: number;
  page: number;
}

export interface BatchMintParams {
  projectUid: string;
  count: number;
  receiver: string;
  blockchain: Blockchain;
}

export interface BatchMintRequest {
  reserveNfts: {
    lovelace: number;
    nftUid: string;
    tokencount: number;
  }[];
}

export interface BatchProcessingSummary {
  totalBatches: number;
  successfulBatches: number;
  failedBatches: number;
  firstError?: string;
  transactionIds: string[];
  failedItems: Array<{ error: string; batchId: string }>;
  batches: BatchRecord[];
}

export interface MintAndSendResult {
  mintAndSendId?: number;
  sendedNft?: NFT[];
}

export interface NftDetailsResponse {
  id: number;
  uid: string;
  name: string;
  displayname: string;
  title: string;
  series: string;
  state: string;
  detaildata: string;
  minted: boolean;
  uploadSource: string;
  receiveraddress: string;
  policyid: string;
  assetid: string;
  assetname: string;
  fingerprint: string;
  initialminttxhash: string;
  ipfshash: string;
  ipfsGatewayAddress: string;
  metadata: string;
  singlePrice: number;
  singlePriceSolana: number;
  priceInLovelaceCentralPayments: number;
  priceInLamportCentralPayments: number;
  priceInOctsCentralPayments: number;
  sendBackCentralPaymentInLovelace: number;
  paymentGatewayLinkForSpecificSale: string;
  mintedOnBlockchain: 'Cardano';
  mintingfees: number;
  selldate: string; // ISO Date string
  reserveduntil: string; // ISO Date string
  soldby: string;
}

export interface NftCountResponse {
  nftTotal: number;
  sold: number;
  free: number;
  reserved: number;
  error: number;
  blocked: number;
  totalTokens: number;
  totalBlocked: number;
  unknownOrBurnedState: number;
}

// ==================== Transaction Interfaces ====================
export interface TransactionNFT {
  assetName: string;
  fingerprint: string;
  txHashSolanaTransaction: string;
}

export interface GetTransactionNfts {
  assetName?: string;
  fingerprint?: string;
  tokenCount: number;
  multiplier: number;
  txHashSolanaTransaction?: string;
  confirmed: boolean;
}

export interface ProjectTransaction {
  created: string;
  state?: string;
  nftprojectId: number;
  ada: number;
  fee: number;
  mintingcostsada: number;
  projectada: number;
  projectincomingtxhash?: string;
  receiveraddress?: string;
  senderaddress?: string;
  transactionid?: string;
  transactiontype?: string;
  projectaddress?: string;
  eurorate: number;
  nftcount: number;
  tokencount: number;
  originatoraddress?: string;
  stakereward: number;
  stakeaddress?: string;
  additionalPayoutWallets: number;
  confirmed: boolean;
  priceintokensquantity: number;
  priceintokenspolicyid?: string;
  priceintokenstokennamehex?: string;
  priceintokensmultiplier: number;
  nmkrcosts: number;
  discount: number;
  customerProperty?: string;
  blockchain: Blockchain;
  transactionNfts?: GetTransactionNfts[];
  coin?: string;
  projectname?: string;
  nftProjectUid?: string;
}

// ==================== Project Interfaces ====================
export interface NftProjectDetails {
  id: number;
  projectname: string;
  projecturl?: string;
  projectLogo?: string;
  state?: string;
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
  description?: string;
  addressReservationTime: number;
  policyId: string;
  enableCrossSaleOnPaymentGateway: boolean;
  adaPayoutWalletAddress: string;
  usdcPayoutWalletAddress?: string;
  enableFiatPayments: boolean;
  paymentGatewaySaleStart?: string;
  enableDecentralPayments: boolean;
  policyLocks: string;
  royaltyAddress?: string;
  royaltyPercent?: number;
  lockslot: number;
  disableManualMintingbutton: boolean;
  disableRandomSales: boolean;
  disableSpecificSales: boolean;
  twitterHandle?: string;
  nmkrAccountOptions: string;
  crossmintCollectiondId?: string;
  created: string;
  blockchains: Blockchain[];
  solanaProjectDetails?: SolanaProjectDetails;
  aptosProjectDetails?: AptosProjectDetails;
  solanaPayoutWalletAddress?: string;
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

// ==================== Report Interfaces ====================
export interface ReportPaths {
  csvPath: string;
}

export interface ReportStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  createdAt: string;
  updatedAt?: string;
  csvPath?: string;
  error?: {
    message: string;
    code: string;
  };
}

export interface BatchRecord {
  id: string;
  size: number;
  startIdx: number;
  endIdx: number;
  success: boolean;
  result: MintAndSendResult;
  status: string;
  error?: string;
  createdAt: string;
}

export interface CsvRecord {
  fieldID: string;
  tokenID: string;
  txID: string;
  explorerURL: string;
}

// ==================== Error Interfaces ====================
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    field?: string;
    reportId?: string;
    batchId?: string;
  };
  timestamp: string;
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

export interface BucketObject {
  [key: string]: unknown;
}

export interface CsvHeaders {
  [key: string]: string;
}

export enum Role {
  admin = 'admin',
  user = 'user',
}

export interface User {
  role: Role;
  fields: string[];
}

export interface RequestWithUser extends Request {
  user?: User;
}

export interface TokenPayload extends JwtPayload, User {}
