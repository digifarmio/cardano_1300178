import type { Metadata } from './types';

export const fieldStatuses = ['Ready', 'Pending', 'In Progress', 'Minted'];
export const nftStatuses = ['Claimable', 'Owned', 'Locked'];

export const generateNftsRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    fieldId: (i + 1).toString(),
    size: Math.floor(Math.random() * 91) + 10,
    sustainability: Math.floor(Math.random() * 91) + 10,
    status: nftStatuses[i % nftStatuses.length],
  }));

export function parseMetadata(jsonString: string): Metadata | null {
  try {
    const parsed = JSON.parse(jsonString);

    // Validate structure
    if (!parsed['721']) return null;
    const block721 = parsed['721'];

    // Get the dynamic policyId key — first key inside block721 that's not "version"
    const policyIdKey = Object.keys(block721).find((key) => key !== 'version');
    if (!policyIdKey) return null;

    const metadataObj = block721[policyIdKey];
    // Get the first NFT key inside policy
    const nftKey = Object.keys(metadataObj)[0];
    if (!nftKey) return null;

    const raw = metadataObj[nftKey];

    return {
      area: parseFloat(raw.area),
      crop: parseFloat(raw.crop),
      last: parseFloat(raw.last),
      tile: raw.tile,
      dates: raw.dates.split(','),
      SustInd: parseFloat(raw.SustInd),
      country: raw.country,
      version: raw.version,
      flatness: parseFloat(raw.flatness),
      src_proj: parseInt(raw.src_proj, 10),
      perimeter: parseFloat(raw.perimeter),
      center_lat: parseFloat(raw.center_lat),
      center_lng: parseFloat(raw.center_lng),
      confidence: parseFloat(raw.confidence),
      exterior_area: parseFloat(raw.exterior_area),
      number_of_vertices: parseInt(raw.number_of_vertices, 10),
      number_of_vertices_simplified: parseInt(raw.number_of_vertices_simplified, 10),
      herbaceous_vegetation: parseInt(raw.herbaceous_vegetation, 10),
      shrubs: parseInt(raw.shrubs, 10),
      open_forest: parseInt(raw.open_forest, 10),
      id: raw.id,
      id_long: raw.id_long,
      center: raw.center.split(',').map(Number) as [number, number],
    };
  } catch (e) {
    console.error('Failed to parse or normalize metadata:', e);
    return null;
  }
}
