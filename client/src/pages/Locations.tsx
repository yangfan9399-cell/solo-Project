import { useEffect, useState } from 'react';
import { Plus, Search, MapPin, Building2, Home, Factory, Wrench } from 'lucide-react';
import { locationsApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { Button, Modal, Input, Select } from '../components/Modal';
import type { Location } from '../types';

const typeIcons: Record<string, React.ReactNode> = {
  water_plant: <Building2 className="w-5 h-5" />,
  pipe_network: <Wrench className="w-5 h-5" />,
  community: <Home className="w-5 h-5" />,
  factory: <Factory className="w-5 h-5" />,
};

const typeLabels: Record<string, string> = {
  water_plant: '水厂',
  pipe_network: '管网监测点',
  community: '小区',
  factory: '工厂/企业',
};

export function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'water_plant' as Location['type'],
    address: '',
    area: '',
    population: '',
  });

  useEffect(() => {
    fetchLocations();
  }, [typeFilter]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationsApi.getAll(typeFilter || undefined);
      setLocations(response.data);
    } catch (err) {
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await locationsApi.create({
        ...formData,
        population: formData.population ? parseInt(formData.population) : undefined,
      });
      fetchLocations();
      setIsModalOpen(false);
      setFormData({
        name: '',
        type: 'water_plant',
        address: '',
        area: '',
        population: '',
      });
    } catch (err) {
      alert('提交失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此地点吗？')) return;
    try {
      await locationsApi.delete(id);
      fetchLocations();
    } catch (err) {
      alert('删除失败，请重试');
    }
  };

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={fetchLocations} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">地点管理</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增地点
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="搜索地点..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: '', label: '全部类型' },
            { value: 'water_plant', label: '水厂' },
            { value: 'pipe_network', label: '管网监测点' },
            { value: 'community', label: '小区' },
            { value: 'factory', label: '工厂/企业' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLocations.length === 0 ? (
          <div className="col-span-full">
            <EmptyState title="暂无地点" description="还没有添加任何地点" icon={MapPin} />
          </div>
        ) : (
          filteredLocations.map((location) => (
            <div key={location.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                    {typeIcons[location.type]}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{location.name}</h3>
                    <span className="text-xs text-gray-500">{typeLabels[location.type]}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(location.id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  删除
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {location.address}
                </div>
                <div>所属区域：{location.area}</div>
                {location.population && <div>服务人口：约{location.population}人</div>}
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增地点" size="md">
        <div className="space-y-4">
          <Input
            label="地点名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入地点名称"
          />
          <Select
            label="地点类型"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as Location['type'] })}
            options={[
              { value: 'water_plant', label: '水厂' },
              { value: 'pipe_network', label: '管网监测点' },
              { value: 'community', label: '小区' },
              { value: 'factory', label: '工厂/企业' },
            ]}
          />
          <Input
            label="详细地址"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="请输入详细地址"
          />
          <Input
            label="所属区域"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
            placeholder="如：城东区"
          />
          <Input
            label="服务人口（可选）"
            type="number"
            value={formData.population}
            onChange={(e) => setFormData({ ...formData, population: e.target.value })}
            placeholder="请输入服务人口数"
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
