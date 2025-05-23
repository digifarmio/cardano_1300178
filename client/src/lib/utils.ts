export const fieldStatuses = ['Ready', 'Pending', 'In Progress', 'Minted'];
export const nftStatuses = ['Claimable', 'Owned', 'Locked'];

export const generateFieldsRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    fieldId: (i + 1).toString(),
    size: Math.floor(Math.random() * 91) + 10,
    sustainability: Math.floor(Math.random() * 91) + 10,
    status: fieldStatuses[i % fieldStatuses.length],
  }));

export const generateNftsRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    fieldId: (i + 1).toString(),
    size: Math.floor(Math.random() * 91) + 10,
    sustainability: Math.floor(Math.random() * 91) + 10,
    status: nftStatuses[i % nftStatuses.length],
  }));

export const mockData = [
  { date: '2025-05-20', totalFields: 24, minted: 22, failed: 2 },
  { date: '2025-05-18', totalFields: 43, minted: 43, failed: 0 },
  { date: '2025-05-15', totalFields: 59, minted: 56, failed: 3 },
];
