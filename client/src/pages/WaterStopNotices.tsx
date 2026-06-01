import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Filter, Megaphone, MapPin, Clock } from 'lucide-react';
import { waterStopNoticesApi, usersApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { StatusBadge } from '../components/StatusBadge';
import { Button, Modal, Input, Select, TextArea } from '../components/Modal';
import { formatDate } from '../utils/format';
import { useRole } from '../context/RoleContext';
import type { WaterStopNotice, User } from '../types';

export function WaterStopNotices() {
  const [notices, setNotices] = useState<WaterStopNotice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentRole } = useRole();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    affected_area: '',
    affected_population: '',
    start_time: '',
    end_time: '',
    reason: '',
  });

  const defaultCreator = useMemo(() => {
    const roleUsers = users.filter((u) => u.role === currentRole);
    if (roleUsers.length > 0) return roleUsers[0];
    const adminUsers = users.filter((u) => u.role === 'admin');
    return adminUsers[0] || users[0];
  }, [users, currentRole]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [noticesRes, usersRes] = await Promise.all([
          waterStopNoticesApi.getAll(),
          usersApi.getAll(),
        ]);
        setNotices(noticesRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError('加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    if (!defaultCreator) return;
    try {
      await waterStopNoticesApi.create({
        ...formData,
        affected_population: formData.affected_population ? parseInt(formData.affected_population) : undefined,
        created_by: defaultCreator.id,
      });
      const response = await waterStopNoticesApi.getAll();
      setNotices(response.data);
      setIsModalOpen(false);
      setFormData({
        title: '',
        content: '',
        affected_area: '',
        affected_population: '',
        start_time: '',
        end_time: '',
        reason: '',
      });
    } catch (err) {
      alert('提交失败，请重试');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await waterStopNoticesApi.publish(id);
      const response = await waterStopNoticesApi.getAll();
      setNotices(response.data);
    } catch (err) {
      alert('发布失败，请重试');
    }
  };

  const handleEnd = async (id: string) => {
    try {
      await waterStopNoticesApi.end(id);
      const response = await waterStopNoticesApi.getAll();
      setNotices(response.data);
    } catch (err) {
      alert('结束失败，请重试');
    }
  };

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch = notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.affected_area.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || notice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">停水公告</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          发布停水公告
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="搜索停水公告..."
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
              { value: 'scheduled', label: '计划中' },
              { value: 'active', label: '进行中' },
              { value: 'ended', label: '已结束' },
            ]}
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredNotices.length === 0 ? (
          <EmptyState title="暂无停水公告" description="还没有停水公告记录" icon={Megaphone} />
        ) : (
          filteredNotices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                    <StatusBadge status={notice.status} />
                    {notice.published && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">已发布</span>
                    )}
                  </div>
                  <div className="text-gray-600 mb-3">{notice.content}</div>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      影响区域：{notice.affected_area}
                      {notice.affected_population && ` (约${notice.affected_population}人)`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {notice.start_time} - {notice.end_time}
                    </div>
                    <div>原因：{notice.reason}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {notice.status === 'scheduled' && !notice.published && (
                    <Button size="sm" onClick={() => handlePublish(notice.id)}>
                      发布公告
                    </Button>
                  )}
                  {notice.status === 'active' && (
                    <Button size="sm" variant="secondary" onClick={() => handleEnd(notice.id)}>
                      结束停水
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="发布停水公告" size="xl">
        <div className="space-y-4">
          <Input
            label="标题"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="请输入停水公告标题"
          />
          <TextArea
            label="公告内容"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={3}
            placeholder="请输入详细的停水说明"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="影响区域"
              value={formData.affected_area}
              onChange={(e) => setFormData({ ...formData, affected_area: e.target.value })}
              placeholder="如：城东区人民路沿线"
            />
            <Input
              label="影响人数"
              type="number"
              value={formData.affected_population}
              onChange={(e) => setFormData({ ...formData, affected_population: e.target.value })}
              placeholder="可选"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="开始时间"
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
            <Input
              label="结束时间"
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>
          <Select
            label="停水原因"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            options={[
              { value: '', label: '请选择原因' },
              { value: '管网维修', label: '管网维修' },
              { value: '水质异常处理', label: '水质异常处理' },
              { value: '设备检修', label: '设备检修' },
              { value: '水管爆裂抢修', label: '水管爆裂抢修' },
              { value: '其他', label: '其他' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>创建公告</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
