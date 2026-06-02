export const API_BASE = '/api';

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setToken = (token) => {
  localStorage.setItem('token', token);
};

export const removeToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatMoney = (amount) => {
  return `¥${Number(amount || 0).toFixed(2)}`;
};

export const getStatusText = (status) => {
  const statusMap = {
    pending: '待处理',
    confirmed: '已确认',
    arrived: '已到货',
    reserved: '已预留',
    picked: '已取书',
    cancelled: '已取消',
    refunded: '已退款',
    expired: '已过期',
    draft: '草稿',
    submitted: '已提交',
    partial: '部分到货',
    received: '已到货',
    sorting: '分拣中',
    sorted: '已分拣',
    delivered: '已交付',
    open: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
    sent: '已发送',
    failed: '发送失败',
    read: '已读',
    completed: '已完成',
  };
  return statusMap[status] || status;
};

export const getLevelText = (level) => {
  const levelMap = {
    normal: '普通会员',
    silver: '银卡会员',
    gold: '金卡会员',
    platinum: '白金会员',
  };
  return levelMap[level] || level;
};

export const getExceptionTypeText = (type) => {
  const typeMap = {
    damage: '损坏',
    missing: '缺失',
    wrong_book: '错发',
    quality: '质量问题',
    other: '其他',
  };
  return typeMap[type] || type;
};
