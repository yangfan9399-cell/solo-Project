'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_LABELS } from '@/lib/constants';

interface Customer {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
}

export default function NewOrder() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerId: 1,
    productName: '',
    category: 'brochure',
    quantity: 1000,
    paperType: '铜版纸',
    paperWeight: '250g',
    size: 'A4',
    craft: '覆膜',
    colorMode: 'CMYK四色',
    description: '',
    deliveryDate: '',
  });

  useEffect(() => {
    fetchCustomers();

    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    setFormData((prev) => ({
      ...prev,
      deliveryDate: defaultDate.toISOString().split('T')[0],
    }));
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers');
    const data = await res.json();
    setCustomers(data);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'submitted',
          salesId: 1,
          designerId: 2,
          operatorName: '张经理',
        }),
      });

      if (res.ok) {
        const order = await res.json();
        router.push(`/orders/${order.id}`);
      } else {
        const err = await res.json();
        alert(err.error || '创建订单失败');
      }
    } catch (error) {
      alert('创建订单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回订单列表
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">业务员提交需求</h1>
            <p className="text-sm text-gray-500">填写印刷品需求信息，提交后进入打样流程</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              基本信息
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  客户 <span className="text-red-500">*</span>
                </label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="例如：企业宣传画册"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  产品品类 <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              纸张与工艺
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  纸张类型 <span className="text-red-500">*</span>
                </label>
                <select
                  name="paperType"
                  value={formData.paperType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="铜版纸">铜版纸</option>
                  <option value="哑粉纸">哑粉纸</option>
                  <option value="白卡纸">白卡纸</option>
                  <option value="特种纸">特种纸</option>
                  <option value="双胶纸">双胶纸</option>
                  <option value="牛皮纸">牛皮纸</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  纸张克重
                </label>
                <input
                  type="text"
                  name="paperWeight"
                  value={formData.paperWeight}
                  onChange={handleChange}
                  placeholder="例如：250g"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规格尺寸 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  placeholder="例如：A4 / 60x90cm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  彩色模式 <span className="text-red-500">*</span>
                </label>
                <select
                  name="colorMode"
                  value={formData.colorMode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="CMYK四色">CMYK四色</option>
                  <option value="专色">专色</option>
                  <option value="黑白">黑白</option>
                  <option value="双色">双色</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工艺要求 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="craft"
                  value={formData.craft}
                  onChange={handleChange}
                  placeholder="例如：覆膜+烫金 / 过油 / 击凸"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-100">
              交期与备注
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  交货日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  需求说明
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="请详细说明印刷品的具体要求、注意事项等..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Link
              href="/"
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '提交中...' : '提交需求'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
