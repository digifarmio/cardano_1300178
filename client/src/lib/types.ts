import type { JwtPayload } from 'jwt-decode';

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
  state: string;
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
  state: string;
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

export interface Metadata {
  area: number;
  crop: number;
  last: number;
  tile: string;
  dates: string[];
  SustInd: number;
  country: string;
  version: string;
  flatness: number;
  src_proj: number;
  perimeter: number;
  center_lat: number;
  center_lng: number;
  confidence: number;
  exterior_area: number;
  number_of_vertices: number;
  number_of_vertices_simplified: number;
  herbaceous_vegetation: number;
  shrubs: number;
  open_forest: number;
  id: string;
  id_long: string;
  center: [number, number];
}

export interface MintingReport {
  date: string;
  totalFields: number;
  minted: number;
  failed: number;
  csvUrl?: string;
}
