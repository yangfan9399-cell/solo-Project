'use client';

import { create } from 'zustand';
import { Order } from './mockData';
import {
  fetchOrders as apiFetchOrders,
  fetchOrder as apiFetchOrder,
  approveOrder as apiApproveOrder,
  rejectOrder as apiRejectOrder,
  archiveOrder as apiArchiveOrder,
  supplementDocuments as apiSupplementDocuments,
  resolveClassification as apiResolveClassification,
  resolveAmountDiscrepancy as apiResolveAmountDiscrepancy,
} from './api';

interface OrderStore {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: string) => Promise<Order | undefined>;
  getOrder: (id: string) => Order | undefined;
  approveOrder: (orderId: string, reviewerName?: string) => Promise<Order>;
  rejectOrder: (orderId: string, reviewerName: string, reason: string) => Promise<Order>;
  archiveOrder: (orderId: string, operatorName?: string) => Promise<Order>;
  supplementDocuments: (orderId: string, handlerName: string, notes: string) => Promise<Order>;
  resolveClassification: (
    orderId: string,
    handlerName: string,
    finalHsCode: string,
    notes: string
  ) => Promise<Order>;
  resolveAmountDiscrepancy: (
    orderId: string,
    handlerName: string,
    correctedAmount: number,
    notes: string
  ) => Promise<Order>;
  clearError: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await apiFetchOrders();
      set({ orders, loading: false });
    } catch (error) {
      set({
        orders: [],
        loading: false,
        error: (error as Error).message,
      });
      throw error;
    }
  },

  fetchOrder: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const order = await apiFetchOrder(id);
      if (order) {
        set(state => ({
          orders: state.orders.map(o => o.id === id ? order : o),
          loading: false,
        }));
        return order;
      }
      set({ loading: false });
      return undefined;
    } catch (error) {
      set({ loading: false, error: (error as Error).message });
      throw error;
    }
  },

  getOrder: (id: string) => {
    return get().orders.find(o => o.id === id);
  },

  approveOrder: async (orderId: string, reviewerName = '李明') => {
    const updatedOrder = await apiApproveOrder(orderId, reviewerName);
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
    }));
    return updatedOrder;
  },

  rejectOrder: async (orderId: string, reviewerName = '李明', reason: string) => {
    const updatedOrder = await apiRejectOrder(orderId, reviewerName, reason);
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
    }));
    return updatedOrder;
  },

  archiveOrder: async (orderId: string, operatorName = '系统') => {
    const updatedOrder = await apiArchiveOrder(orderId, operatorName);
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
    }));
    return updatedOrder;
  },

  supplementDocuments: async (orderId: string, handlerName = '张伟', notes: string) => {
    const updatedOrder = await apiSupplementDocuments(orderId, handlerName, notes);
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
    }));
    return updatedOrder;
  },

  resolveClassification: async (
    orderId: string,
    handlerName = '张伟',
    finalHsCode: string,
    notes: string
  ) => {
    const updatedOrder = await apiResolveClassification(orderId, handlerName, finalHsCode, notes);
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
    }));
    return updatedOrder;
  },

  resolveAmountDiscrepancy: async (
    orderId: string,
    handlerName = '张伟',
    correctedAmount: number,
    notes: string
  ) => {
    const updatedOrder = await apiResolveAmountDiscrepancy(orderId, handlerName, correctedAmount, notes);
    set(state => ({
      orders: state.orders.map(o => o.id === orderId ? updatedOrder : o),
    }));
    return updatedOrder;
  },
}));
