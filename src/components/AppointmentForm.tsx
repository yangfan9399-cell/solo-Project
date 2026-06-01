import { useState, useEffect } from 'react';

interface AppointmentFormProps {
  onSuccess?: () => void;
}

interface Employee {
  id: number;
  name: string;
  department: string | null;
}

const idTypeOptions = [
  { value: '身份证', label: '身份证' },
  { value: '护照', label: '护照' },
  { value: '驾照', label: '驾照' },
  { value: '其他', label: '其他' },
];

const initialForm = {
  visitor_name: '',
  visitor_phone: '',
  visitor_id_type: '身份证',
  visitor_id_number: '',
  visitor_company: '',
  visitee_id: '',
  purpose: '',
  expected_arrival: '',
  expected_leave: '',
  notes: '',
};

export default function AppointmentForm({ onSuccess }: AppointmentFormProps) {
  const [form, setForm] = useState(initialForm);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blacklistError, setBlacklistError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/users?role=employee')
      .then((res) => res.json())
      .then(setEmployees)
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setBlacklistError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setBlacklistError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          visitee_id: Number(form.visitee_id) || undefined,
          visitor_company: form.visitor_company || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (res.status === 403) {
        const data = await res.json();
        setBlacklistError(data.error || '该访客已被加入黑名单');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '提交失败');
        return;
      }

      setSuccess(true);
      setForm(initialForm);
      onSuccess?.();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
      {success && (
        <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
          预约提交成功！
        </div>
      )}

      {blacklistError && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          🚫 {blacklistError}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">访客姓名 *</label>
          <input
            type="text"
            name="visitor_name"
            value={form.visitor_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">访客手机号 *</label>
          <input
            type="tel"
            name="visitor_phone"
            value={form.visitor_phone}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">证件类型 *</label>
          <select
            name="visitor_id_type"
            value={form.visitor_id_type}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {idTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">证件号码 *</label>
          <input
            type="text"
            name="visitor_id_number"
            value={form.visitor_id_number}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">访客公司</label>
          <input
            type="text"
            name="visitor_company"
            value={form.visitor_company}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">被访人 *</label>
          <select
            name="visitee_id"
            value={form.visitee_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">请选择被访人</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}{emp.department ? ` - ${emp.department}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">来访事由 *</label>
          <input
            type="text"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">预计到达时间 *</label>
          <input
            type="datetime-local"
            name="expected_arrival"
            value={form.expected_arrival}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">预计离开时间 *</label>
          <input
            type="datetime-local"
            name="expected_leave"
            value={form.expected_leave}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? '提交中...' : '提交预约'}
        </button>
      </div>
    </form>
  );
}
