import { Order } from './mockData';

export async function fetchOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/orders', { 
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn('[API] fetchOrders failed, using mock data:', (error as Error).message);
    const { mockOrders } = await import('./mockData');
    return [...mockOrders];
  }
}

export async function fetchOrder(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders/${id}`, {
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error('Failed to fetch order');
    }
    return res.json();
  } catch (error) {
    console.warn('API unavailable, using mock data:', error);
    const { getOrderById } = await import('./mockData');
    return getOrderById(id) || null;
  }
}

export async function approveOrder(orderId: string, reviewerName = '李明') {
  const res = await fetch(`/api/orders/${orderId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to approve order');
  }
  return res.json();
}

export async function rejectOrder(orderId: string, reviewerName = '李明', reason: string) {
  const res = await fetch(`/api/orders/${orderId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewerName, reason }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to reject order');
  }
  return res.json();
}

export async function archiveOrder(orderId: string, operatorName = '系统') {
  const res = await fetch(`/api/orders/${orderId}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operatorName }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to archive order');
  }
  return res.json();
}

export async function supplementDocuments(orderId: string, handlerName = '张伟', notes: string) {
  const res = await fetch(`/api/orders/${orderId}/supplement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handlerName, notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to supplement documents');
  }
  return res.json();
}

export async function resolveClassification(
  orderId: string, 
  handlerName = '张伟', 
  finalHsCode: string, 
  notes: string
) {
  const res = await fetch(`/api/orders/${orderId}/classification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handlerName, finalHsCode, notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to resolve classification');
  }
  return res.json();
}

export async function resolveAmountDiscrepancy(
  orderId: string,
  handlerName = '张伟',
  correctedAmount: number,
  notes: string
) {
  const res = await fetch(`/api/orders/${orderId}/amount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ handlerName, correctedAmount, notes }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to resolve amount discrepancy');
  }
  return res.json();
}
