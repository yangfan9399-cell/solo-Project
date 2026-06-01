import { useState } from 'react'
import { useApi, useApiPost, useApiPut } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import type { PartnerLibrary } from '@/types'
import { Building2, Plus, Pencil } from 'lucide-react'

const levelConfig: Record<string, { label: string; className: string }> = {
  key: { label: '核心', className: 'bg-amber-100 text-amber-700' },
  important: { label: '重要', className: 'bg-slate-200 text-slate-600' },
  normal: { label: '普通', className: 'bg-gray-100 text-gray-500' },
}

const libStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: '活跃', className: 'bg-green-100 text-green-700' },
  inactive: { label: '停用', className: 'bg-gray-100 text-gray-500' },
}

interface FormState {
  name: string
  code: string
  contact_person: string
  contact_phone: string
  contact_email: string
  address: string
  province: string
  city: string
  cooperation_level: string
  status: string
}

const emptyForm: FormState = {
  name: '',
  code: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  province: '',
  city: '',
  cooperation_level: 'normal',
  status: 'active',
}

export default function Libraries() {
  const { data: libraries, loading, error, refetch } = useApi<PartnerLibrary[]>('/api/libraries')
  const { post, loading: creating } = useApiPost('')
  const { put, loading: updating } = useApiPut('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PartnerLibrary | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  if (loading) return <LoadingSpinner text="加载合作馆数据..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const list = libraries || []

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (lib: PartnerLibrary) => {
    setEditing(lib)
    setForm({
      name: lib.name,
      code: lib.code,
      contact_person: lib.contact_person,
      contact_phone: lib.contact_phone,
      contact_email: lib.contact_email,
      address: lib.address,
      province: lib.province,
      city: lib.city,
      cooperation_level: lib.cooperation_level,
      status: lib.status,
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (editing) {
      await put(`/api/libraries/${editing.id}`, form)
    } else {
      await post('/api/libraries', form)
    }
    setShowModal(false)
    refetch()
  }

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-slate-800">合作馆管理</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增合作馆
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Building2} title="暂无合作馆" description="点击右上角添加第一个合作馆" />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {list.map((lib) => {
            const level = levelConfig[lib.cooperation_level] || levelConfig.normal
            const status = libStatusConfig[lib.status] || libStatusConfig.inactive
            return (
              <div key={lib.id} className="bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-slate-800">{lib.name}</h3>
                  <button
                    onClick={() => openEdit(lib)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-mono mb-3">{lib.code}</p>
                <p className="text-sm text-slate-500 mb-2">{lib.address}</p>
                <p className="text-sm text-slate-500 mb-3">
                  {lib.contact_person} · {lib.contact_phone}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${level.className}`}>
                    {level.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">互借请求: {lib.request_count ?? 0}</p>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 mx-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {editing ? '编辑合作馆' : '新增合作馆'}
            </h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">馆名</label>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">代码</label>
                <input
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">联系人</label>
                <input
                  value={form.contact_person}
                  onChange={(e) => updateField('contact_person', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">电话</label>
                <input
                  value={form.contact_phone}
                  onChange={(e) => updateField('contact_phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
                <input
                  value={form.contact_email}
                  onChange={(e) => updateField('contact_email', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">地址</label>
                <input
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">省份</label>
                  <input
                    value={form.province}
                    onChange={(e) => updateField('province', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">城市</label>
                  <input
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">合作等级</label>
                  <select
                    value={form.cooperation_level}
                    onChange={(e) => updateField('cooperation_level', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="key">核心</option>
                    <option value="important">重要</option>
                    <option value="normal">普通</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">活跃</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating || updating}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creating || updating ? '提交中...' : '提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
