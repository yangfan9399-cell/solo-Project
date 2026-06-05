'use client';

import { create } from 'zustand';
import { 
  Order, 
  OrderStatus, 
  mockOrders, 
} from './mockData';
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
  approveOrder: (orderId: string, reviewerName?: string) => Promise<boolean>;
  rejectOrder: (orderId: string, reviewerName: string, reason: string) => Promise<boolean>;
  archiveOrder: (orderId: string, operatorName?: string) => Promise<boolean>;
  supplementDocuments: (orderId: string, handlerName: string, notes: string) => Promise<boolean>;
  resolveClassification: (
    orderId: string, 
    handlerName: string, 
    finalHsCode: string, 
    notes: string
  ) => Promise<boolean>;
  resolveAmountDiscrepancy: (
    orderId: string,
    handlerName: string,
    correctedAmount: number,
    notes: string
  ) => Promise<boolean>;
  useMockFallback: boolean;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: mockOrders,
  loading: false,
  error: null,
  useMockFallback: true,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await apiFetchOrders();
      const isMock = orders.length > 0 && orders[0].id === mockOrders[0]?.id;
      set({ orders, loading: false, useMockFallback: isMock });
      return orders;
    } catch (error) {
      console.error('[Store] fetchOrders error:', error);
      set({ 
        orders: mockOrders, 
        loading: false, 
        error: (error as Error).message,
        useMockFallback: true
      });
      return mockOrders;
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
      const { getOrderById } = await import('./mockData');
      return getOrderById(id);
    }
  },

  getOrder: (id: string) => {
    return get().orders.find(o => o.id === id);
  },

  approveOrder: async (orderId: string, reviewerName = '李明') => {
    try {
      await apiApproveOrder(orderId, reviewerName);
      await get().fetchOrders();
      return true;
    } catch (error) {
      const { useOrderStore: store } = await import('./orderStore');
      const state = store.getState();
      if (state.useMockFallback) {
        const { mockOrders } = await import('./mockData');
        const order = state.orders.find(o => o.id === orderId);
        if (order?.status === 'INVOICE_MISMATCH') {
          throw new Error('金额不符的订单无法放行，请先更正金额');
        }
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'APPROVED' as OrderStatus,
                customsReviewerName: reviewerName,
                historyNodes: [...o.historyNodes, {
                  id: `h-${Date.now()}`,
                  action: '放行通过',
                  status: 'APPROVED',
                  notes: '单证齐全，准予放行',
                  operator: reviewerName,
                  role: '关务复核人',
                  timestamp: new Date().toISOString(),
                }],
                clearanceBasis: o.clearanceBasis ? {
                  ...o.clearanceBasis,
                  approvedBy: reviewerName,
                } : o.clearanceBasis,
              };
            }
            return o;
          }),
        }));
        return true;
      }
      throw error;
    }
  },

  rejectOrder: async (orderId: string, reviewerName = '李明', reason: string) => {
    try {
      await apiRejectOrder(orderId, reviewerName, reason);
      await get().fetchOrders();
      return true;
    } catch (error) {
      const state = get();
      if (state.useMockFallback) {
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'REJECTED' as OrderStatus,
                customsReviewerName: reviewerName,
                historyNodes: [...o.historyNodes, {
                  id: `h-${Date.now()}`,
                  action: '退回',
                  status: 'REJECTED',
                  notes: reason,
                  operator: reviewerName,
                  role: '关务复核人',
                  timestamp: new Date().toISOString(),
                }],
              };
            }
            return o;
          }),
        }));
        return true;
      }
      throw error;
    }
  },

  archiveOrder: async (orderId: string, operatorName = '系统') => {
    try {
      await apiArchiveOrder(orderId, operatorName);
      await get().fetchOrders();
      return true;
    } catch (error) {
      const state = get();
      if (state.useMockFallback) {
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'ARCHIVED' as OrderStatus,
                historyNodes: [...o.historyNodes, {
                  id: `h-${Date.now()}`,
                  action: '归档',
                  status: 'ARCHIVED',
                  notes: null,
                  operator: operatorName,
                  role: '系统',
                  timestamp: new Date().toISOString(),
                }],
              };
            }
            return o;
          }),
        }));
        return true;
      }
      throw error;
    }
  },

  supplementDocuments: async (orderId: string, handlerName = '张伟', notes: string) => {
    try {
      await apiSupplementDocuments(orderId, handlerName, notes);
      await get().fetchOrders();
      return true;
    } catch (error) {
      const state = get();
      if (state.useMockFallback) {
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'UNDER_REVIEW' as OrderStatus,
                documentStatus: 'COMPLETE',
                documentHandlerName: handlerName,
                documents: o.documents.map(d => 
                  d.status === 'MISSING' || d.status === 'PENDING'
                    ? { ...d, status: 'VERIFIED', uploadedBy: handlerName }
                    : d
                ),
                historyNodes: [...o.historyNodes, {
                  id: `h-${Date.now()}`,
                  action: '资料补充完成',
                  status: 'UNDER_REVIEW',
                  notes,
                  operator: handlerName,
                  role: '单证经办人',
                  timestamp: new Date().toISOString(),
                }],
              };
            }
            return o;
          }),
        }));
        return true;
      }
      throw error;
    }
  },

  resolveClassification: async (
    orderId: string, 
    handlerName = '张伟', 
    finalHsCode: string, 
    notes: string
  ) => {
    try {
      await apiResolveClassification(orderId, handlerName, finalHsCode, notes);
      await get().fetchOrders();
      return true;
    } catch (error) {
      const state = get();
      if (state.useMockFallback) {
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'UNDER_REVIEW' as OrderStatus,
                documentHandlerName: handlerName,
                items: o.items.map(item => ({
                  ...item,
                  hsCode: finalHsCode,
                  declaredHsCode: finalHsCode,
                  classificationNote: null,
                })),
                classificationNote: o.classificationNote ? {
                  ...o.classificationNote,
                  status: 'RESOLVED',
                  resolved: true,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: handlerName,
                } : null,
                historyNodes: [...o.historyNodes, {
                  id: `h-${Date.now()}`,
                  action: '归类说明确认',
                  status: 'UNDER_REVIEW',
                  notes: `最终HS编码: ${finalHsCode}, ${notes}`,
                  operator: handlerName,
                  role: '单证经办人',
                  timestamp: new Date().toISOString(),
                }],
              };
            }
            return o;
          }),
        }));
        return true;
      }
      throw error;
    }
  },

  resolveAmountDiscrepancy: async (
    orderId: string,
    handlerName = '张伟',
    correctedAmount: number,
    notes: string
  ) => {
    try {
      await apiResolveAmountDiscrepancy(orderId, handlerName, correctedAmount, notes);
      await get().fetchOrders();
      return true;
    } catch (error) {
      const state = get();
      if (state.useMockFallback) {
        set((state) => ({
          orders: state.orders.map(o => {
            if (o.id === orderId) {
              return {
                ...o,
                status: 'UNDER_REVIEW' as OrderStatus,
                declaredAmount: correctedAmount,
                actualAmount: correctedAmount,
                documentHandlerName: handlerName,
                documents: o.documents.map(d => 
                  d.status === 'MISMATCH' ? { ...d, status: 'VERIFIED' } : d
                ),
                amountDiscrepancy: o.amountDiscrepancy ? {
                  ...o.amountDiscrepancy,
                  resolved: true,
                  resolvedAt: new Date().toISOString(),
                  resolvedBy: handlerName,
                } : null,
                historyNodes: [...o.historyNodes, {
                  id: `h-${Date.now()}`,
                  action: '金额更正完成',
                  status: 'UNDER_REVIEW',
                  notes: `更正后金额: ¥${correctedAmount.toFixed(2)}, ${notes}`,
                  operator: handlerName,
                  role: '单证经办人',
                  timestamp: new Date().toISOString(),
                }],
              };
            }
            return o;
          }),
        }));
        return true;
      }
      throw error;
    }
  },
}));
