import { create } from 'zustand';
import type { NFT } from '../lib/types';

interface SelectionState {
  // Store both keys and full NFT data for selected items
  selectedRowKeys: React.Key[];
  selectedNfts: Map<React.Key, NFT>;
  selectAllReady: boolean;

  // Actions
  setSelectedRowKeys: (keys: React.Key[], nfts: NFT[]) => void;
  addSelection: (keys: React.Key[], nfts: NFT[]) => void;
  removeSelection: (keys: React.Key[]) => void;
  toggleSelection: (key: React.Key, nft: NFT) => void;
  clearSelection: () => void;
  setSelectAllReady: (ready: boolean) => void;

  // Helpers
  isSelected: (key: React.Key) => boolean;
  getSelectedCount: () => number;
  getSelectedNftsByKeys: (keys: React.Key[]) => NFT[];
  getAllSelectedNfts: () => NFT[];
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedRowKeys: [],
  selectedNfts: new Map(),
  selectAllReady: false,

  setSelectedRowKeys: (keys: React.Key[], nfts: NFT[]) => {
    const selectedNfts = new Map<string, NFT>();
    const newNftsMap = new Map<string, NFT>(nfts.map((nft) => [nft.uid, nft]));

    keys.forEach((key) => {
      const strKey = String(key);
      const nft = newNftsMap.get(strKey) || get().selectedNfts.get(strKey);
      if (nft) {
        selectedNfts.set(strKey, nft);
      }
    });

    set({
      selectedRowKeys: keys,
      selectedNfts,
    });
  },

  addSelection: (keys: React.Key[], nfts: NFT[]) => {
    const state = get();
    const newSelectedKeys = [...new Set([...state.selectedRowKeys, ...keys])];
    const newSelectedNfts = new Map(state.selectedNfts);

    keys.forEach((key) => {
      const nft = nfts.find((n) => n.uid === key);
      if (nft) {
        newSelectedNfts.set(key, nft);
      }
    });

    set({
      selectedRowKeys: newSelectedKeys,
      selectedNfts: newSelectedNfts,
    });
  },

  removeSelection: (keys: React.Key[]) => {
    const state = get();
    const newSelectedKeys = state.selectedRowKeys.filter((key) => !keys.includes(key));
    const newSelectedNfts = new Map(state.selectedNfts);

    keys.forEach((key) => {
      newSelectedNfts.delete(key);
    });

    set({
      selectedRowKeys: newSelectedKeys,
      selectedNfts: newSelectedNfts,
    });
  },

  toggleSelection: (key: React.Key, nft: NFT) => {
    const state = get();
    if (state.selectedRowKeys.includes(key)) {
      get().removeSelection([key]);
    } else {
      get().addSelection([key], [nft]);
    }
  },

  clearSelection: () => {
    set({
      selectedRowKeys: [],
      selectedNfts: new Map(),
      selectAllReady: false,
    });
  },

  setSelectAllReady: (ready: boolean) => {
    set({ selectAllReady: ready });
  },

  // Helper functions
  isSelected: (key: React.Key) => {
    return get().selectedRowKeys.includes(key);
  },

  getSelectedCount: () => {
    return get().selectedRowKeys.length;
  },

  getSelectedNftsByKeys: (keys: React.Key[]) => {
    const selectedNfts = get().selectedNfts;
    return keys.map((key) => selectedNfts.get(key)).filter(Boolean) as NFT[];
  },

  getAllSelectedNfts: () => {
    return Array.from(get().selectedNfts.values());
  },
}));
