import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ticketsAPI } from '../api/index.js'

function TicketForm({ categories, technicians, currentUser, onSuccess, onCancel }) {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'normal',
    owner_name: '',
    owner_phone: '',
    owner_address: '',
    assignee_id: '',
    estimated_hours: '',
  })

  const createMutation = useMutation({
    mutationFn: (data) => ticketsAPI.create({
      ...data,
      creator_id: 1,
      category_id: data.category_id ? parseInt(data.category_id) : null,
      assignee_id: data.assignee_id ? parseInt(data.assignee_id) : null,
      estimated_hours: data.estimated_hours ? parseFloat(data.estimated_hours) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
      queryClient.invalidateQueries(['dashboardStats'])
      onSuccess?.()
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.owner_name || !formData.owner_phone || !formData.owner_address) {
      alert('请填写必填项')
      return
    }
    createMutation.mutate(formData)
  }

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel?.()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">新建报修单</div>
          <button className="modal-close" onClick={onCancel}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">标题 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入问题标题"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">问题描述</label>
              <textarea
                className="form-textarea"
                placeholder="请详细描述问题"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">故障分类</label>
                <select
                  className="form-select"
                  value={formData.category_id}
                  onChange={(e) => handleChange('category_id', e.target.value)}
                >
                  <option value="">请选择分类</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">优先级</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => handleChange('priority', e.target.value)}
                >
                  <option value="low">低</option>
                  <option value="normal">普通</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">业主姓名 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入业主姓名"
                  value={formData.owner_name}
                  onChange={(e) => handleChange('owner_name', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">联系电话 *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入联系电话"
                  value={formData.owner_phone}
                  onChange={(e) => handleChange('owner_phone', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">业主地址 *</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入业主地址"
                value={formData.owner_address}
                onChange={(e) => handleChange('owner_address', e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">分派维修人员</label>
                <select
                  className="form-select"
                  value={formData.assignee_id}
                  onChange={(e) => handleChange('assignee_id', e.target.value)}
                >
                  <option value="">暂不派工</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">预计工时（小时）</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="请输入预计工时"
                  value={formData.estimated_hours}
                  onChange={(e) => handleChange('estimated_hours', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-default"
              onClick={onCancel}
              disabled={createMutation.isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? '提交中...' : '提交'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TicketForm
