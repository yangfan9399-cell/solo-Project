import { create } from 'zustand';
import type { WorkTicket, User, CreateTicketDto, ApproveTicketDto, RejectTicketDto, UpdateTicketDto } from '../../shared/types';

interface TicketState {
  tickets: WorkTicket[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  fetchTickets: (status?: string, keyword?: string) => Promise<void>;
  fetchTicket: (id: string) => Promise<WorkTicket | null>;
  fetchUsers: () => Promise<void>;
  createTicket: (dto: CreateTicketDto) => Promise<{ success: boolean; error?: string; ticket?: WorkTicket }>;
  updateTicket: (id: string, dto: UpdateTicketDto) => Promise<{ success: boolean; error?: string }>;
  approveTicket: (id: string, dto: ApproveTicketDto) => Promise<{ success: boolean; error?: string }>;
  rejectTicket: (id: string, dto: RejectTicketDto) => Promise<{ success: boolean; error?: string }>;
  lockTicket: (id: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  printTicket: (id: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentUser: (user: User) => void;
}

const API_BASE = '/api';

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(API_BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }
  return data;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  users: [],
  currentUser: null,
  loading: false,
  error: null,

  fetchTickets: async (status, keyword) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (keyword) params.set('keyword', keyword);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const tickets = await apiRequest<WorkTicket[]>(`/tickets${qs}`);
      set({ tickets, loading: false, error: null });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  fetchTicket: async (id) => {
    set({ loading: true });
    try {
      const ticket = await apiRequest<WorkTicket>(`/tickets/${id}`);
      set({ loading: false, error: null });
      return ticket;
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
      return null;
    }
  },

  fetchUsers: async () => {
    try {
      const users = await apiRequest<User[]>('/users');
      set({ users });
      if (!get().currentUser && users.length > 0) {
        set({ currentUser: users[0] });
      }
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },

  createTicket: async (dto) => {
    try {
      const ticket = await apiRequest<WorkTicket>('/tickets', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return { success: true, ticket };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  updateTicket: async (id, dto) => {
    try {
      await apiRequest(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dto),
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  approveTicket: async (id, dto) => {
    try {
      await apiRequest(`/tickets/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  rejectTicket: async (id, dto) => {
    try {
      await apiRequest(`/tickets/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify(dto),
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  lockTicket: async (id, userId) => {
    try {
      await apiRequest(`/tickets/${id}/lock`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  printTicket: async (id) => {
    try {
      await apiRequest(`/tickets/${id}/print`, { method: 'POST' });
      return { success: true };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
}));
