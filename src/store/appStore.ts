import { create } from 'zustand';
import type { Batch, BatchStatus } from '../types';
import { api } from '../lib/api';

interface CurrentUser {
  name: string;
  role: 'observer' | 'consultant';
}

interface AppState {
  currentUser: CurrentUser | null;
  batches: Batch[];
  statusFilter: BatchStatus | 'all';
  searchQuery: string;
  loading: boolean;
  setCurrentUser: (u: CurrentUser | null) => void;
  setStatusFilter: (s: BatchStatus | 'all') => void;
  setSearchQuery: (q: string) => void;
  loadBatches: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: { name: '王审之', role: 'consultant' },
  batches: [],
  statusFilter: 'all',
  searchQuery: '',
  loading: false,
  setCurrentUser: (u) => set({ currentUser: u }),
  setStatusFilter: (s) => {
    set({ statusFilter: s });
    get().loadBatches();
  },
  setSearchQuery: (q) => {
    set({ searchQuery: q });
    get().loadBatches();
  },
  loadBatches: async () => {
    set({ loading: true });
    try {
      const data = await api.getBatches({
        status: get().statusFilter,
        search: get().searchQuery || undefined,
      });
      set({ batches: data });
    } catch (e) {
      console.error('加载批次失败', e);
    } finally {
      set({ loading: false });
    }
  },
}));
