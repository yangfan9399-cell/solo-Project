import fs from 'fs';
import path from 'path';

export interface User {
  id: number;
  name: string;
  role: 'sales' | 'designer' | 'customer' | 'production_manager';
  email: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string | null;
  createdAt: string;
}

export interface Order {
  id: number;
  orderNo: string;
  customerId: number;
  productName: string;
  category: string;
  quantity: number;
  paperType: string;
  paperWeight: string | null;
  size: string;
  craft: string;
  colorMode: string;
  description: string | null;
  status: string;
  deliveryDate: string;
  originalDeliveryDate: string | null;
  salesId: number;
  designerId: number | null;
  rejectReason: string | null;
  rejectRemark: string | null;
  returnReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Proof {
  id: number;
  orderId: number;
  version: number;
  imageUrl: string;
  remark: string | null;
  uploadedBy: number;
  colorDeviation: string | null;
  createdAt: string;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  status: string;
  operatorId: number | null;
  operatorName: string;
  remark: string | null;
  createdAt: string;
}

interface DatabaseData {
  users: User[];
  customers: Customer[];
  orders: Order[];
  proofs: Proof[];
  orderHistory: OrderHistory[];
  nextIds: {
    users: number;
    customers: number;
    orders: number;
    proofs: number;
    orderHistory: number;
  };
}

const dbPath = path.join(process.cwd(), 'data.json');

function getDefaultData(): DatabaseData {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  const daysLater = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    users: [
      { id: 1, name: '张经理', role: 'sales', email: 'zhang@print.com', createdAt: daysAgo(30) },
      { id: 2, name: '李设计师', role: 'designer', email: 'li@print.com', createdAt: daysAgo(30) },
      { id: 3, name: '王主管', role: 'production_manager', email: 'wang@print.com', createdAt: daysAgo(30) },
      { id: 4, name: '陈客户', role: 'customer', email: 'chen@customer.com', createdAt: daysAgo(30) },
      { id: 5, name: '刘客户', role: 'customer', email: 'liu@customer.com', createdAt: daysAgo(30) },
      { id: 6, name: '赵客户', role: 'customer', email: 'zhao@customer.com', createdAt: daysAgo(30) },
    ],
    customers: [
      { id: 1, name: '星辰科技有限公司', contactPerson: '陈总', phone: '13800138001', email: 'chen@xingchen.com', address: '北京市朝阳区科技园区A座', createdAt: daysAgo(30) },
      { id: 2, name: '明月贸易有限公司', contactPerson: '刘经理', phone: '13800138002', email: 'liu@mingyue.com', address: '上海市浦东新区贸易大厦B座', createdAt: daysAgo(30) },
      { id: 3, name: '朝阳传媒集团', contactPerson: '赵总监', phone: '13800138003', email: 'zhao@chaoyang.com', address: '广州市天河区传媒中心C座', createdAt: daysAgo(30) },
    ],
    orders: [
      {
        id: 1,
        orderNo: 'PO202606001',
        customerId: 1,
        productName: '企业宣传画册',
        category: 'brochure',
        quantity: 5000,
        paperType: '铜版纸',
        paperWeight: '250g',
        size: 'A4',
        craft: '覆膜+烫金',
        colorMode: 'CMYK四色',
        description: '企业年度宣传画册，包含公司简介、产品介绍、案例展示等',
        status: 'order_placed',
        deliveryDate: daysLater(10),
        originalDeliveryDate: daysLater(10),
        salesId: 1,
        designerId: 2,
        rejectReason: null,
        rejectRemark: null,
        returnReason: null,
        createdAt: daysAgo(7),
        updatedAt: daysAgo(1),
      },
      {
        id: 2,
        orderNo: 'PO202606002',
        customerId: 2,
        productName: '产品海报',
        category: 'poster',
        quantity: 2000,
        paperType: '哑粉纸',
        paperWeight: '200g',
        size: '60x90cm',
        craft: '过油',
        colorMode: 'CMYK四色',
        description: '新品发布海报，颜色要求较高，需与品牌色一致',
        status: 'customer_rejected',
        deliveryDate: daysLater(15),
        originalDeliveryDate: daysLater(15),
        salesId: 1,
        designerId: 2,
        rejectReason: 'color_deviation',
        rejectRemark: '蓝色偏差较大，与品牌标准色Pantone 2945C有明显差异',
        returnReason: null,
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
      },
      {
        id: 3,
        orderNo: 'PO202606003',
        customerId: 3,
        productName: '商务名片',
        category: 'business_card',
        quantity: 10000,
        paperType: '特种纸',
        paperWeight: '300g',
        size: '90x54mm',
        craft: '烫银+击凸',
        colorMode: '专色',
        description: '管理层商务名片，高端质感',
        status: 'proof_uploaded',
        deliveryDate: daysLater(20),
        originalDeliveryDate: daysLater(20),
        salesId: 1,
        designerId: 2,
        rejectReason: null,
        rejectRemark: null,
        returnReason: null,
        createdAt: daysAgo(3),
        updatedAt: daysAgo(2),
      },
      {
        id: 4,
        orderNo: 'PO202606004',
        customerId: 1,
        productName: '产品包装盒',
        category: 'packaging',
        quantity: 3000,
        paperType: '白卡纸',
        paperWeight: '350g',
        size: '20x15x8cm',
        craft: '覆膜+UV',
        colorMode: 'CMYK四色',
        description: '新款产品外包装盒',
        status: 'production_review',
        deliveryDate: daysLater(5),
        originalDeliveryDate: daysLater(12),
        salesId: 1,
        designerId: 2,
        rejectReason: null,
        rejectRemark: null,
        returnReason: null,
        createdAt: daysAgo(10),
        updatedAt: daysAgo(0),
      },
      {
        id: 5,
        orderNo: 'PO202606005',
        customerId: 2,
        productName: '宣传单页',
        category: 'flyer',
        quantity: 10000,
        paperType: '铜版纸',
        paperWeight: '157g',
        size: 'A4双面',
        craft: '折页',
        colorMode: 'CMYK四色',
        description: '促销活动宣传单页',
        status: 'submitted',
        deliveryDate: daysLater(25),
        originalDeliveryDate: daysLater(25),
        salesId: 1,
        designerId: null,
        rejectReason: null,
        rejectRemark: null,
        returnReason: null,
        createdAt: daysAgo(1),
        updatedAt: daysAgo(1),
      },
      {
        id: 6,
        orderNo: 'PO202606006',
        customerId: 3,
        productName: '企业画册',
        category: 'booklet',
        quantity: 2000,
        paperType: '哑粉纸',
        paperWeight: '200g封面+157g内页',
        size: 'A4',
        craft: '锁线胶装',
        colorMode: 'CMYK四色',
        description: '企业形象画册，共32页',
        status: 'order_returned',
        deliveryDate: daysLater(30),
        originalDeliveryDate: daysLater(20),
        salesId: 1,
        designerId: 2,
        rejectReason: null,
        rejectRemark: null,
        returnReason: '交期需要重新评估，当前产能紧张',
        createdAt: daysAgo(8),
        updatedAt: daysAgo(2),
      },
    ],
    proofs: [
      { id: 1, orderId: 1, version: 1, imageUrl: '/proofs/po1-v1.svg', remark: '第一版打样', uploadedBy: 2, colorDeviation: null, createdAt: daysAgo(6) },
      { id: 2, orderId: 1, version: 2, imageUrl: '/proofs/po1-v2.svg', remark: '根据客户反馈调整字体和版式', uploadedBy: 2, colorDeviation: null, createdAt: daysAgo(4) },
      { id: 3, orderId: 2, version: 1, imageUrl: '/proofs/po2-v1.svg', remark: '海报第一版，蓝色系', uploadedBy: 2, colorDeviation: '蓝色偏紫', createdAt: daysAgo(4) },
      { id: 4, orderId: 3, version: 1, imageUrl: '/proofs/po3-v1.svg', remark: '名片打样，烫银效果', uploadedBy: 2, colorDeviation: null, createdAt: daysAgo(2) },
      { id: 5, orderId: 4, version: 1, imageUrl: '/proofs/po4-v1.svg', remark: '包装盒第一版打样', uploadedBy: 2, colorDeviation: null, createdAt: daysAgo(8) },
      { id: 6, orderId: 4, version: 2, imageUrl: '/proofs/po4-v2.svg', remark: '调整交期后最终版', uploadedBy: 2, colorDeviation: null, createdAt: daysAgo(1) },
      { id: 7, orderId: 6, version: 1, imageUrl: '/proofs/po6-v1.svg', remark: '画册第一版', uploadedBy: 2, colorDeviation: null, createdAt: daysAgo(6) },
    ],
    orderHistory: [
      { orderId: 1, status: 'draft', operatorId: 1, operatorName: '张经理', remark: '创建订单', createdAt: daysAgo(7) },
      { orderId: 1, status: 'submitted', operatorId: 1, operatorName: '张经理', remark: '提交需求，等待设计打样', createdAt: daysAgo(7) },
      { orderId: 1, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '上传第一版打样', createdAt: daysAgo(6) },
      { orderId: 1, status: 'customer_rejected', operatorId: 4, operatorName: '陈客户', remark: '字体需要调整，版式需要优化', createdAt: daysAgo(5) },
      { orderId: 1, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '上传第二版打样，调整字体和版式', createdAt: daysAgo(4) },
      { orderId: 1, status: 'customer_confirmed', operatorId: 4, operatorName: '陈客户', remark: '确认样稿，可以下单', createdAt: daysAgo(3) },
      { orderId: 1, status: 'production_review', operatorId: 3, operatorName: '王主管', remark: '进入生产复核', createdAt: daysAgo(2) },
      { orderId: 1, status: 'order_placed', operatorId: 3, operatorName: '王主管', remark: '复核通过，正式下单生产', createdAt: daysAgo(1) },

      { orderId: 2, status: 'draft', operatorId: 1, operatorName: '张经理', remark: '创建订单', createdAt: daysAgo(5) },
      { orderId: 2, status: 'submitted', operatorId: 1, operatorName: '张经理', remark: '提交需求', createdAt: daysAgo(5) },
      { orderId: 2, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '上传海报打样', createdAt: daysAgo(4) },
      { orderId: 2, status: 'customer_rejected', operatorId: 5, operatorName: '刘客户', remark: '颜色偏差：蓝色与品牌标准色有明显差异', createdAt: daysAgo(2) },

      { orderId: 3, status: 'draft', operatorId: 1, operatorName: '张经理', remark: '创建订单', createdAt: daysAgo(3) },
      { orderId: 3, status: 'submitted', operatorId: 1, operatorName: '张经理', remark: '提交需求', createdAt: daysAgo(3) },
      { orderId: 3, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '上传名片打样', createdAt: daysAgo(2) },

      { orderId: 4, status: 'draft', operatorId: 1, operatorName: '张经理', remark: '创建订单', createdAt: daysAgo(10) },
      { orderId: 4, status: 'submitted', operatorId: 1, operatorName: '张经理', remark: '提交需求', createdAt: daysAgo(10) },
      { orderId: 4, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '上传第一版打样', createdAt: daysAgo(8) },
      { orderId: 4, status: 'customer_confirmed', operatorId: 4, operatorName: '陈客户', remark: '样稿确认', createdAt: daysAgo(6) },
      { orderId: 4, status: 'production_review', operatorId: 3, operatorName: '王主管', remark: '进入复核', createdAt: daysAgo(5) },
      { orderId: 4, status: 'order_returned', operatorId: 3, operatorName: '王主管', remark: '交期紧张，需要与客户协商延期', createdAt: daysAgo(4) },
      { orderId: 4, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '交期调整后重新上传确认', createdAt: daysAgo(1) },
      { orderId: 4, status: 'customer_confirmed', operatorId: 4, operatorName: '陈客户', remark: '同意新交期，确认样稿', createdAt: daysAgo(0) },
      { orderId: 4, status: 'production_review', operatorId: 3, operatorName: '王主管', remark: '再次进入生产复核', createdAt: daysAgo(0) },

      { orderId: 5, status: 'draft', operatorId: 1, operatorName: '张经理', remark: '创建订单', createdAt: daysAgo(1) },
      { orderId: 5, status: 'submitted', operatorId: 1, operatorName: '张经理', remark: '提交需求', createdAt: daysAgo(1) },

      { orderId: 6, status: 'draft', operatorId: 1, operatorName: '张经理', remark: '创建订单', createdAt: daysAgo(8) },
      { orderId: 6, status: 'submitted', operatorId: 1, operatorName: '张经理', remark: '提交需求', createdAt: daysAgo(8) },
      { orderId: 6, status: 'proof_uploaded', operatorId: 2, operatorName: '李设计师', remark: '上传画册打样', createdAt: daysAgo(6) },
      { orderId: 6, status: 'customer_confirmed', operatorId: 6, operatorName: '赵客户', remark: '确认样稿', createdAt: daysAgo(4) },
      { orderId: 6, status: 'production_review', operatorId: 3, operatorName: '王主管', remark: '进入复核', createdAt: daysAgo(3) },
      { orderId: 6, status: 'order_returned', operatorId: 3, operatorName: '王主管', remark: '交期需要重新评估，当前产能紧张', createdAt: daysAgo(2) },
    ],
    nextIds: {
      users: 7,
      customers: 4,
      orders: 7,
      proofs: 8,
      orderHistory: 31,
    },
  };
}

let data: DatabaseData | null = null;

function loadData(): DatabaseData {
  if (data) return data;

  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      data = JSON.parse(raw);
    } else {
      data = getDefaultData();
      saveData();
    }
  } catch (e) {
    data = getDefaultData();
  }

  return data!;
}

function saveData() {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function getUsers(): User[] {
  return loadData().users;
}

export function getCustomers(): Customer[] {
  return loadData().customers;
}

export function getOrders(): Order[] {
  return loadData().orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getOrderById(id: number): Order | undefined {
  return loadData().orders.find((o) => o.id === id);
}

export function getProofsByOrderId(orderId: number): Proof[] {
  return loadData().proofs
    .filter((p) => p.orderId === orderId)
    .sort((a, b) => b.version - a.version);
}

export function getOrderHistoryByOrderId(orderId: number): OrderHistory[] {
  return loadData().orderHistory
    .filter((h) => h.orderId === orderId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function createOrder(orderData: Omit<Order, 'id' | 'orderNo' | 'createdAt' | 'updatedAt' | 'status' | 'originalDeliveryDate' | 'rejectReason' | 'rejectRemark' | 'returnReason'> & { status?: string }): Order {
  const db = loadData();
  const id = db.nextIds.orders++;
  const now = new Date().toISOString();
  const orderNo = 'PO' + new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0') + String(id).padStart(3, '0');

  const order: Order = {
    id,
    orderNo,
    customerId: orderData.customerId,
    productName: orderData.productName,
    category: orderData.category,
    quantity: orderData.quantity,
    paperType: orderData.paperType,
    paperWeight: orderData.paperWeight || null,
    size: orderData.size,
    craft: orderData.craft,
    colorMode: orderData.colorMode,
    description: orderData.description || null,
    status: orderData.status || 'draft',
    deliveryDate: orderData.deliveryDate,
    originalDeliveryDate: orderData.deliveryDate,
    salesId: orderData.salesId,
    designerId: orderData.designerId || null,
    rejectReason: null,
    rejectRemark: null,
    returnReason: null,
    createdAt: now,
    updatedAt: now,
  };

  db.orders.push(order);
  saveData();
  return order;
}

export function updateOrderStatus(orderId: number, status: string, updates: Partial<Order> = {}): Order | undefined {
  const db = loadData();
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return undefined;

  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (updates.rejectReason !== undefined) order.rejectReason = updates.rejectReason;
  if (updates.rejectRemark !== undefined) order.rejectRemark = updates.rejectRemark;
  if (updates.returnReason !== undefined) order.returnReason = updates.returnReason;

  saveData();
  return order;
}

export function addProof(proofData: Omit<Proof, 'id' | 'createdAt'>): Proof {
  const db = loadData();
  const id = db.nextIds.proofs++;

  const proof: Proof = {
    id,
    orderId: proofData.orderId,
    version: proofData.version,
    imageUrl: proofData.imageUrl,
    remark: proofData.remark || null,
    uploadedBy: proofData.uploadedBy,
    colorDeviation: proofData.colorDeviation || null,
    createdAt: new Date().toISOString(),
  };

  db.proofs.push(proof);
  saveData();
  return proof;
}

export function addOrderHistory(historyData: Omit<OrderHistory, 'id' | 'createdAt'>): OrderHistory {
  const db = loadData();
  const id = db.nextIds.orderHistory++;

  const history: OrderHistory = {
    id,
    orderId: historyData.orderId,
    status: historyData.status,
    operatorId: historyData.operatorId || null,
    operatorName: historyData.operatorName,
    remark: historyData.remark || null,
    createdAt: new Date().toISOString(),
  };

  db.orderHistory.push(history);
  saveData();
  return history;
}

export function getCustomerById(id: number): Customer | undefined {
  return loadData().customers.find((c) => c.id === id);
}

export function getUserById(id: number): User | undefined {
  return loadData().users.find((u) => u.id === id);
}
