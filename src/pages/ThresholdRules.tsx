import { useStore } from '@/store/useStore'
import { useEffect, useState } from 'react'
import { Plus, Edit3, Save, X, History, SlidersHorizontal, Shield } from 'lucide-react'
import type { ThresholdRule } from '@/types'

interface RuleForm {
  name: string
  min_value: string
  max_value: string
  threshold: string
}

const emptyForm: RuleForm = {
  name: '',
  min_value: '',
  max_value: '',
  threshold: '',
}

export default function ThresholdRules() {
  const { rules, fetchRules, createRule, updateRule, fetchRuleVersions } = useStore()

  const [showModal, setShowModal] = useState(false)
  const [editingRule, setEditingRule] = useState<ThresholdRule | null>(null)
  const [form, setForm] = useState<RuleForm>(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [versions, setVersions] = useState<ThresholdRule[]>([])

  useEffect(() => {
    fetchRules()
  }, [])

  const openCreate = () => {
    setEditingRule(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEdit = (rule: ThresholdRule) => {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      min_value: String(rule.min_value),
      max_value: String(rule.max_value),
      threshold: String(rule.threshold),
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRule(null)
    setForm(emptyForm)
  }

  const handleSubmit = async () => {
    const data = {
      name: form.name,
      min_value: Number(form.min_value),
      max_value: Number(form.max_value),
      threshold: Number(form.threshold),
    }
    if (editingRule) {
      await updateRule(editingRule.id, data)
    } else {
      await createRule(data)
    }
    closeModal()
  }

  const toggleHistory = async (rule: ThresholdRule) => {
    if (expandedId === rule.id) {
      setExpandedId(null)
      setVersions([])
      return
    }
    setExpandedId(rule.id)
    const data = await fetchRuleVersions(rule.id)
    setVersions(data)
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-slate-200 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SlidersHorizontal className="w-7 h-7 text-[#38BDF8]" />
            <h1 className="text-2xl font-bold tracking-wide">阈值规则管理</h1>
          </div>
          <p className="text-sm text-slate-400 ml-10">
            管理桅骨风车传感器校准偏差的阈值判定规则，支持版本化管理和历史追溯
          </p>
        </div>

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-lg font-semibold">生效规则</h2>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#38BDF8] hover:bg-[#38BDF8]/80 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增规则
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          {rules.map((rule) => (
            <div key={rule.id}>
              <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5 relative">
                <span className="absolute top-4 right-4 bg-[#38BDF8]/20 text-[#38BDF8] text-xs font-mono px-2 py-0.5 rounded">
                  v{rule.version}
                </span>

                <h3 className="text-lg font-semibold mb-3 pr-16">{rule.name}</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">量程范围:</span>
                    <span className="font-mono">
                      {rule.min_value} ~ {rule.max_value}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">偏差阈值:</span>
                    <span className="text-2xl font-bold text-[#38BDF8]">{rule.threshold}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2A3F5F]/50">
                  <div className="flex items-center gap-2">
                    {rule.is_active ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-emerald-400">生效中</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <span className="text-xs text-slate-500">未生效</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHistory(rule)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        expandedId === rule.id
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          : 'text-slate-400 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10'
                      }`}
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEdit(rule)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#38BDF8] hover:bg-[#38BDF8]/10 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {expandedId === rule.id && versions.length > 0 && (
                <div className="mt-3 bg-[#0F1D32] rounded-xl border border-[#2A3F5F] p-4">
                  <h4 className="text-sm font-medium text-[#F59E0B] mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    版本历史
                  </h4>
                  <div className="relative pl-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#2A3F5F]" />
                    {versions.map((v) => (
                      <div key={v.id} className="relative pb-3 last:pb-0">
                        <span className="absolute left-[-13px] top-1.5 w-2 h-2 rounded-full bg-[#38BDF8] border-2 border-[#0F1D32]" />
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-[#38BDF8] text-xs">v{v.version}</span>
                            <span className="text-slate-300">阈值: {v.threshold}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{new Date(v.created_at).toLocaleString('zh-CN')}</span>
                            {v.is_active ? (
                              <span className="text-emerald-400">生效中</span>
                            ) : (
                              <span className="text-slate-600">已归档</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {rules.length === 0 && (
            <div className="col-span-2 text-center py-16 text-slate-500">
              <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-30" />
              暂无规则数据
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div className="w-full max-w-md bg-[#1B2A4A] border border-[#2A3F5F] rounded-xl p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              {editingRule ? (
                <>
                  <Edit3 className="w-5 h-5 text-[#38BDF8]" />
                  编辑规则
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-[#38BDF8]" />
                  新增规则
                </>
              )}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">规则名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最小值</label>
                  <input
                    type="number"
                    value={form.min_value}
                    onChange={(e) => setForm({ ...form, min_value: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">最大值</label>
                  <input
                    type="number"
                    value={form.max_value}
                    onChange={(e) => setForm({ ...form, max_value: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">偏差阈值</label>
                <input
                  type="number"
                  value={form.threshold}
                  onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                  className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.min_value || !form.max_value || !form.threshold}
                className="w-full flex items-center justify-center gap-2 bg-[#38BDF8] hover:bg-[#38BDF8]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingRule ? '保存修改' : '创建规则'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
