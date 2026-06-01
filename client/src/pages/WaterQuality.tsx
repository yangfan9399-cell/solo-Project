import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { waterQualityApi, locationsApi, usersApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { Button, Modal, Input, Select, TextArea } from '../components/Modal';
import { formatDate } from '../utils/format';
import type { WaterQualityTest, Location, User } from '../types';

export function WaterQuality() {
  const [tests, setTests] = useState<WaterQualityTest[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    location_id: '',
    ph: '',
    turbidity: '',
    residual_chlorine: '',
    coliform: '',
    remark: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [testsRes, locationsRes, usersRes] = await Promise.all([
          waterQualityApi.getAll(statusFilter || undefined),
          locationsApi.getAll(),
          usersApi.getAll(),
        ]);
        setTests(testsRes.data);
        setLocations(locationsRes.data);
        setUsers(usersRes.data.filter((u) => u.role === 'chemist'));
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [statusFilter]);

  const handleSubmit = async () => {
    try {
      const location = locations.find((l) => l.id === formData.location_id);
      await waterQualityApi.create({
        ...formData,
        test_date: new Date().toISOString().split('T')[0],
        location_name: location?.name,
        ph: parseFloat(formData.ph),
        turbidity: parseFloat(formData.turbidity),
        residual_chlorine: parseFloat(formData.residual_chlorine),
        coliform: parseInt(formData.coliform),
        tested_by: users[0]?.id || 'user_001',
        tester_name: users[0]?.name || '张工',
      });
      const response = await waterQualityApi.getAll(statusFilter || undefined);
      setTests(response.data);
      setIsModalOpen(false);
      setFormData({ location_id: '', ph: '', turbidity: '', residual_chlorine: '', coliform: '', remark: '' });
    } catch (err) {
      alert('提交失败，请重试');
    }
  };

  const filteredTests = tests.filter((test) =>
    test.location_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">水质检测管理</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增检测记录
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="搜索检测地点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: '全部状态' },
              { value: 'normal', label: '正常' },
              { value: 'abnormal', label: '异常' },
              { value: 'processing', label: '处理中' },
              { value: 'rechecking', label: '复测中' },
              { value: 'resolved', label: '已解决' },
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredTests.length === 0 ? (
          <EmptyState title="暂无检测记录" description="还没有水质检测记录" />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检测地点</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH值</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浊度</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">余氯</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大肠菌群</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检测人员</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">检测日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium text-gray-900">{test.location_name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={test.ph < 6.5 || test.ph > 8.5 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {test.ph}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={test.turbidity > 1.0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {test.turbidity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={test.residual_chlorine < 0.3 || test.residual_chlorine > 4.0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {test.residual_chlorine}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={test.coliform > 0 ? 'text-red-600 font-medium' : 'text-gray-900'}>
                      {test.coliform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{test.tester_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{test.test_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={test.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Link to={`/water-quality/${test.id}`} className="text-primary-600 hover:text-primary-900">
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增水质检测记录" size="lg">
        <div className="space-y-4">
          <Select
            label="检测地点"
            value={formData.location_id}
            onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
            options={[
              { value: '', label: '请选择检测地点' },
              ...locations.map((l) => ({ value: l.id, label: l.name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="pH值"
              type="number"
              step="0.1"
              value={formData.ph}
              onChange={(e) => setFormData({ ...formData, ph: e.target.value })}
              placeholder="范围：6.5-8.5"
            />
            <Input
              label="浊度 (NTU)"
              type="number"
              step="0.1"
              value={formData.turbidity}
              onChange={(e) => setFormData({ ...formData, turbidity: e.target.value })}
              placeholder="标准：≤1.0"
            />
            <Input
              label="余氯 (mg/L)"
              type="number"
              step="0.1"
              value={formData.residual_chlorine}
              onChange={(e) => setFormData({ ...formData, residual_chlorine: e.target.value })}
              placeholder="范围：0.3-4.0"
            />
            <Input
              label="大肠菌群 (MPN/100mL)"
              type="number"
              value={formData.coliform}
              onChange={(e) => setFormData({ ...formData, coliform: e.target.value })}
              placeholder="标准：不得检出"
            />
          </div>
          <TextArea
            label="备注"
            value={formData.remark}
            onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
            rows={3}
            placeholder="请输入检测备注..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>提交</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
