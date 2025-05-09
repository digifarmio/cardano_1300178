export interface FieldData {
  field_id: string;
  coordinates: string;
  hectares: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface NmkrProject {
  projectUid: string;
  policyId: string;
}

export interface NmkrConfig {
  apiKey: string;
  walletAddress: string;
  baseUrl?: string;
}
