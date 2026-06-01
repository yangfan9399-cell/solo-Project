import { useEffect, useState } from 'react';
import { Plus, Search, Phone, Building } from 'lucide-react';
import { usersApi } from '../services/api';
import { LoadingCard, ErrorState, EmptyState } from '../components/Loading';
import { Button, Modal, Input, Select } from '../components/Modal';
import type { User } from '../types';

const roleLabels: Record<string, string> = {
  chemist: '水厂化验员',
  repair_crew: '管网抢修队',
  hotline: '热线客服',
  admin: '管理员',
};

const roleColors: Record<string, string> = {
  chemist: 'bg-blue-100 text-blue-700',
  repair_crew: 'bg-orange-100 text-orange-700',
  hotline: 'bg-green-100 text-green-700',
  admin: 'bg-purple-100 text-purple-700',
};

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: 'chemist' as User['role'],
    phone: '',
    department: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err) {
      setError('加载数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await usersApi.create(formData);
      fetchUsers();
      setIsModalOpen(false);
      setFormData({
        name: '',
        role: 'chemist',
        phone: '',
        department: '',
      });
    } catch (err) {
      alert('提交失败，请重试');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此用户吗？')) return;
    try {
      await usersApi.delete(id);
      fetchUsers();
    } catch (err) {
      alert('删除失败，请重试');
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingCard />;
  if (error) return <ErrorState message={error} onRetry={fetchUsers} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">人员管理</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新增人员
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="搜索人员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          options={[
            { value: '', label: '全部角色' },
            { value: 'chemist', label: '水厂化验员' },
            { value: 'repair_crew', label: '管网抢修队' },
            { value: 'hotline', label: '热线客服' },
            { value: 'admin', label: '管理员' },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredUsers.length === 0 ? (
          <EmptyState title="暂无人员" description="还没有添加任何人员" />
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">部门</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">联系电话</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="w-4 h-4" />
                      {user.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增人员" size="md">
        <div className="space-y-4">
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入姓名"
          />
          <Select
            label="角色"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
            options={[
              { value: 'chemist', label: '水厂化验员' },
              { value: 'repair_crew', label: '管网抢修队' },
              { value: 'hotline', label: '热线客服' },
              { value: 'admin', label: '管理员' },
            ]}
          />
          <Input
            label="部门"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            placeholder="请输入部门名称"
          />
          <Input
            label="联系电话"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="请输入联系电话"
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
