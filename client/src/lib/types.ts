import type { JwtPayload } from 'jwt-decode';

export type AdminStatKey = 'total' | 'sold' | 'free' | 'reserved' | 'error';

export interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface DecodedToken extends JwtPayload {
  role?: string | string[];
  [key: string]: unknown;
}

export interface ProtectedRouteProps {
  allowedRoles: string[];
}

export interface FieldRecord {
  fieldId: string;
  size: number;
  sustainability: string | number;
  status: string;
}

export interface NFT {
  id: number;
  ipfsLink: string;
  gatewayLink: string;
  state: AdminStatKey;
  name: string;
  displayname: string | null;
  detaildata: unknown | null;
  minted: boolean;
  policyId: string;
  assetId: string;
  assetname: string;
  fingerprint: string | null;
  initialMintTxHash: string | null;
  series: string | null;
  tokenamount: number;
  price: number | null;
  selldate: string;
  paymentGatewayLinkForSpecificSale: string;
  priceSolana: number | null;
  priceAptos: number | null;
  uid: string;
}

export interface NFTDetails {
  id: number;
  ipfshash: string;
  state: AdminStatKey;
  name: string;
  displayname: string;
  detaildata: string;
  minted: boolean;
  receiveraddress: string;
  selldate: string;
  soldby: string;
  reserveduntil: string;
  policyid: string;
  assetid: string;
  assetname: string;
  fingerprint: string;
  initialminttxhash: string;
  title: string;
  series: string;
  ipfsGatewayAddress: string;
  metadata: string;
  singlePrice: number;
  uid: string;
  paymentGatewayLinkForSpecificSale: string;
  sendBackCentralPaymentInLovelace: number;
  priceInLovelaceCentralPayments: number;
  uploadSource: string;
  priceInLamportCentralPayments: number;
  singlePriceSolana: number;
  priceInOctsCentralPayments: number;
  mintedOnBlockchain: string;
  mintingfees: number;
}

export type Metadata = Record<string, unknown>;

export interface MintingReport {
  date: string;
  totalFields: number;
  minted: number;
  failed: number;
  csvUrl?: string;
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
  blockchain: string;
  transactionNfts?: GetTransactionNfts[];
  coin?: string;
  projectname?: string;
  nftProjectUid?: string;
}

export interface GetTransactionNfts {
  assetName?: string;
  fingerprint?: string;
  tokenCount: number;
  multiplier: number;
  txHashSolanaTransaction?: string;
  confirmed: boolean;
}

export interface ReportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt?: string;
  csvPath?: string;
  pdfPath?: string;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface MintBatchResult {
  success: boolean;
  result?: {
    sendedNft: unknown[];
  };
}

export interface MintRandomBatchResponse {
  success: boolean;
  data: {
    totalBatches: number;
    successfulBatches: number;
    failedBatches: number;
    transactionIds: string[];
    failedItems: string[];
    batches: {
      id: string;
      size: number;
      startIdx: number;
      endIdx: number;
      success: boolean;
      result?: {
        mintAndSendId: number;
        sendedNft: {
          id: number;
          uid: string;
          name: string;
          ipfsLink: string;
          gatewayLink: string;
          [key: string]: unknown;
        }[];
      };
      status: string;
      createdAt: string;
    }[];
  };
}
