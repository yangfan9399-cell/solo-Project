'use client';

import { create } from 'zustand';
import { 
  Order, 
  OrderStatus, 
  mockOrders, 
  HistoryNode,
  AmountDiscrepancy,
  ClassificationNote
} from './mockData';

interface OrderStore {
  orders: Order[];
  getOrder: (id: string) => Order | undefined;
  updateOrderStatus: (
    orderId: string, 
    newStatus: OrderStatus, 
    action: string, 
    notes?: string,
    operator?: string,
    role?: string
  ) => void;
  approveOrder: (orderId: string, reviewerName: string) => void;
  rejectOrder: (orderId: string, reviewerName: string, reason: string) => void;
  archiveOrder: (orderId: string, operatorName: string) => void;
  supplementDocuments: (orderId: string, handlerName: string, notes: string) => void;
  resolveClassification: (
    orderId: string, 
    handlerName: string, 
    finalHsCode: string, 
    notes: string
  ) => void;
  resolveAmountDiscrepancy: (
    orderId: string,
    handlerName: string,
    correctedAmount: number,
    notes: string
  ) => void;
  addHistoryNode: (
    orderId: string,
    action: string,
    status: string,
    operator: string,
    role: string,
    notes?: string
  ) => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [...mockOrders],

  getOrder: (id: string) => {
    return get().orders.find(o => o.id === id);
  },

  updateOrderStatus: (orderId, newStatus, action, notes, operator = '李明', role = '关务复核人') => {
    set((state) => ({
      orders: state.orders.map(order => {
        if (order.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action,
            status: newStatus,
            notes: notes || null,
            operator,
            role,
            timestamp: new Date().toISOString(),
          };
          return {
            ...order,
            status: newStatus,
            historyNodes: [...order.historyNodes, newHistoryNode],
          };
        }
        return order;
      }),
    }));
  },

  approveOrder: (orderId: string, reviewerName: string) => {
    const order = get().getOrder(orderId);
    if (!order) return;

    if (order.status === 'INVOICE_MISMATCH') {
      throw new Error('金额不符的订单无法放行，请先更正金额');
    }

    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action: '放行通过',
            status: 'APPROVED',
            notes: '单证齐全，准予放行',
            operator: reviewerName,
            role: '关务复核人',
            timestamp: new Date().toISOString(),
          };
          return {
            ...o,
            status: 'APPROVED' as OrderStatus,
            customsReviewerName: reviewerName,
            historyNodes: [...o.historyNodes, newHistoryNode],
            clearanceBasis: o.clearanceBasis ? {
              ...o.clearanceBasis,
              approvedBy: reviewerName,
            } : o.clearanceBasis,
          };
        }
        return o;
      }),
    }));
  },

  rejectOrder: (orderId: string, reviewerName: string, reason: string) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action: '退回',
            status: 'REJECTED',
            notes: reason,
            operator: reviewerName,
            role: '关务复核人',
            timestamp: new Date().toISOString(),
          };
          return {
            ...o,
            status: 'REJECTED' as OrderStatus,
            customsReviewerName: reviewerName,
            historyNodes: [...o.historyNodes, newHistoryNode],
          };
        }
        return o;
      }),
    }));
  },

  archiveOrder: (orderId: string, operatorName: string) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action: '归档',
            status: 'ARCHIVED',
            notes: null,
            operator: operatorName,
            role: '系统',
            timestamp: new Date().toISOString(),
          };
          return {
            ...o,
            status: 'ARCHIVED' as OrderStatus,
            historyNodes: [...o.historyNodes, newHistoryNode],
          };
        }
        return o;
      }),
    }));
  },

  supplementDocuments: (orderId: string, handlerName: string, notes: string) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action: '资料补充完成',
            status: 'UNDER_REVIEW',
            notes,
            operator: handlerName,
            role: '单证经办人',
            timestamp: new Date().toISOString(),
          };
          const updatedDocuments = o.documents.map(d => 
            d.status === 'MISSING' || d.status === 'PENDING'
              ? { ...d, status: 'VERIFIED', uploadedBy: handlerName }
              : d
          );
          return {
            ...o,
            status: 'UNDER_REVIEW' as OrderStatus,
            documentStatus: 'COMPLETE',
            documentHandlerName: handlerName,
            documents: updatedDocuments,
            historyNodes: [...o.historyNodes, newHistoryNode],
          };
        }
        return o;
      }),
    }));
  },

  resolveClassification: (
    orderId: string, 
    handlerName: string, 
    finalHsCode: string, 
    notes: string
  ) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action: '归类说明确认',
            status: 'UNDER_REVIEW',
            notes: `最终HS编码: ${finalHsCode}, ${notes}`,
            operator: handlerName,
            role: '单证经办人',
            timestamp: new Date().toISOString(),
          };
          const updatedItems = o.items.map(item => ({
            ...item,
            hsCode: finalHsCode,
            declaredHsCode: finalHsCode,
            classificationNote: null,
          }));
          return {
            ...o,
            status: 'UNDER_REVIEW' as OrderStatus,
            items: updatedItems,
            documentHandlerName: handlerName,
            classificationNote: {
              ...o.classificationNote!,
              status: 'RESOLVED',
              resolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: handlerName,
            } as ClassificationNote,
            historyNodes: [...o.historyNodes, newHistoryNode],
          };
        }
        return o;
      }),
    }));
  },

  resolveAmountDiscrepancy: (
    orderId: string,
    handlerName: string,
    correctedAmount: number,
    notes: string
  ) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action: '金额更正完成',
            status: 'UNDER_REVIEW',
            notes: `更正后金额: ¥${correctedAmount.toFixed(2)}, ${notes}`,
            operator: handlerName,
            role: '单证经办人',
            timestamp: new Date().toISOString(),
          };
          return {
            ...o,
            status: 'UNDER_REVIEW' as OrderStatus,
            declaredAmount: correctedAmount,
            actualAmount: correctedAmount,
            documentHandlerName: handlerName,
            documents: o.documents.map(d => 
              d.status === 'MISMATCH' ? { ...d, status: 'VERIFIED' } : d
            ),
            amountDiscrepancy: {
              ...o.amountDiscrepancy!,
              resolved: true,
              resolvedAt: new Date().toISOString(),
              resolvedBy: handlerName,
            } as AmountDiscrepancy,
            historyNodes: [...o.historyNodes, newHistoryNode],
          };
        }
        return o;
      }),
    }));
  },

  addHistoryNode: (orderId, action, status, operator, role, notes) => {
    set((state) => ({
      orders: state.orders.map(o => {
        if (o.id === orderId) {
          const newHistoryNode: HistoryNode = {
            id: `h-${Date.now()}`,
            action,
            status,
            notes: notes || null,
            operator,
            role,
            timestamp: new Date().toISOString(),
          };
          return {
            ...o,
            historyNodes: [...o.historyNodes, newHistoryNode],
          };
        }
        return o;
      }),
    }));
  },
}));
