import { Order } from './mockData';

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders', {
    cache: 'no-store',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `获取订单列表失败 (${res.status})`);
  }
  return res.json();
}

export async function fetchOrder(id: string): Promise<Order | null> {
  const res = await fetch(`/api/orders/${id}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `获取订单详情失败 (${res.status})`);
  }
  return res.json();
}

export async function approveOrder(orderId: string, reviewerName = '李明'): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '放行订单失败');
  }
  return res.json();
}

export async function rejectOrder(orderId: string, reviewerName = '李明', reason: string): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerName, reason }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '退回订单失败');
  }
  return res.json();
}

export async function archiveOrder(orderId: string, operatorName = '系统'): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '归档订单失败');
  }
  return res.json();
}

export async function supplementDocuments(orderId: string, handlerName = '张伟', notes: string): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/supplement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handlerName, notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '补充资料失败');
  }
  return res.json();
}

export async function resolveClassification(
  orderId: string,
  handlerName = '张伟',
  finalHsCode: string,
  notes: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/classification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handlerName, finalHsCode, notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '确认归类失败');
  }
  return res.json();
}

export async function resolveAmountDiscrepancy(
  orderId: string,
  handlerName = '张伟',
  correctedAmount: number,
  notes: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}/amount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handlerName, correctedAmount, notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '更正金额失败');
  }
  return res.json();
}
