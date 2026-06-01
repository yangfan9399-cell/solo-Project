import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ticketsAPI, usersAPI, materialsAPI } from '../api/index.js'
import dayjs from 'dayjs'

function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <div>加载中...</div>
    </div>
  )
}

function TicketDetail({ currentUser }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showFollowUpModal, setShowFollowUpModal] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [actualHours, setActualHours] = useState('')
  const [completeRemark, setCompleteRemark] = useState('')
  const [escalateReason, setEscalateReason] = useState('')
  const [escalateLevel, setEscalateLevel] = useState(1)
  const [assigneeId, setAssigneeId] = useState('')
  const [followUpSatisfaction, setFollowUpSatisfaction] = useState(5)
  const [followUpFeedback, setFollowUpFeedback] = useState('')
  const [closeRemark, setCloseRemark] = useState('')
  const [showCloseModal, setShowCloseModal] = useState(false)

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersAPI.getTechnicians(),
  })

  const { data: materialsData } = useQuery({
    queryKey: ['materials'],
    queryFn: () => materialsAPI.getAll(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsAPI.getById(id),
  })

  const assignMutation = useMutation({
    mutationFn: () => ticketsAPI.assign(id, { assignee_id: parseInt(assigneeId), operator_id: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
      setShowAssignModal(false)
    },
  })

  const acceptMutation = useMutation({
    mutationFn: () => ticketsAPI.accept(id, { operator_id: 2 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => ticketsAPI.complete(id, {
      actual_hours: parseFloat(actualHours) || 0,
      materials: selectedMaterials.filter(m => m.quantity > 0),
      operator_id: 1,
      remark: completeRemark,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
      setShowCompleteModal(false)
      setSelectedMaterials([])
      setActualHours('')
      setCompleteRemark('')
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => ticketsAPI.close(id, { operator_id: 1, remark: closeRemark }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
      setShowCloseModal(false)
    },
  })

  const escalateMutation = useMutation({
    mutationFn: () => ticketsAPI.escalate(id, {
      level: escalateLevel,
      reason: escalateReason,
      operator_id: 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
      setShowEscalateModal(false)
      setEscalateReason('')
      setEscalateLevel(1)
    },
  })

  const followUpMutation = useMutation({
    mutationFn: () => {
      if (followUpSatisfaction < 3 && (!followUpFeedback || !followUpFeedback.trim())) {
        throw new Error('满意度低于3分时必须填写反馈原因')
      }
      return ticketsAPI.addFollowUp(id, {
        operator_id: 1,
        satisfaction: followUpSatisfaction,
        feedback: followUpFeedback,
        follow_up_date: new Date().toISOString(),
        status: 'completed',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', id])
      setShowFollowUpModal(false)
      setFollowUpFeedback('')
      setFollowUpSatisfaction(5)
    },
    onError: (error) => {
      alert(error.message || '提交失败')
    },
  })

  if (isLoading) return <Loading />
  if (error) return <div className="error">加载失败：{error.message}</div>

  const ticket = data?.data
  if (!ticket) return <div className="error">工单不存在</div>

  const materials = materialsData?.data || []

  const handleMaterialChange = (materialId, quantity) => {
    setSelectedMaterials(prev => {
      const existing = prev.find(m => m.material_id === materialId)
      if (existing) {
        if (quantity <= 0) {
          return prev.filter(m => m.material_id !== materialId)
        }
        return prev.map(m => m.material_id === materialId ? { ...m, quantity } : m)
      }
      if (quantity > 0) {
        const mat = materials.find(m => m.id === materialId)
        return [...prev, { material_id: materialId, quantity, unit_price: mat?.unit_price || 0 }]
      }
      return prev
    })
  }

  const getActionButtons = () => {
    const buttons = []
    
    if (['pending'].includes(ticket.status)) {
      buttons.push({ label: '派工', onClick: () => setShowAssignModal(true), type: 'primary' })
    }
    
    if (['assigned'].includes(ticket.status)) {
      buttons.push({ label: '接单', onClick: () => acceptMutation.mutate(), type: 'success' })
    }
    
    if (['in_progress'].includes(ticket.status)) {
      buttons.push({ label: '完成维修', onClick: () => setShowCompleteModal(true), type: 'success' })
    }
    
    if (['completed'].includes(ticket.status)) {
      buttons.push({ label: '质保回访', onClick: () => setShowFollowUpModal(true), type: 'info' })
      buttons.push({ label: '关闭工单', onClick: () => setShowCloseModal(true), type: 'default' })
    }
    
    if (!['closed'].includes(ticket.status)) {
      buttons.push({ label: '异常升级', onClick: () => setShowEscalateModal(true), type: 'danger' })
    }
    
    return buttons
  }

  const getActionLabel = (action, remark) => {
    const labels = {
      create: '创建工单',
      assign: '派工',
      accept: '接单',
      complete: '完成维修',
      close: '关闭工单',
      escalate: '异常升级',
      followup: remark?.includes('异常回访') ? '异常回访' : '质保回访',
    }
    return labels[action] || action
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-default btn-sm" onClick={() => navigate('/tickets')} style={{ marginBottom: '12px' }}>
            ← 返回列表
          </button>
          <h1 className="page-title">
            <span className="tag" style={{ marginRight: '12px' }}>{ticket.ticket_no}</span>
            {ticket.title}
          </h1>
        </div>
        <div className="action-buttons">
          {getActionButtons().map((btn, index) => (
            <button
              key={index}
              className={`btn btn-${btn.type}`}
              onClick={btn.onClick}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {ticket.is_overdue && (
        <div className="escalation-banner">
          <span>⏰</span>
          <span>SLA 已超时！截止时间：{dayjs(ticket.sla_deadline).format('YYYY-MM-DD HH:mm')}，已超时 {dayjs().diff(ticket.sla_deadline, 'hour')} 小时</span>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginLeft: 'auto' }}
            onClick={() => setShowEscalateModal(true)}
          >
            立即升级
          </button>
        </div>
      )}

      {ticket.escalations?.length > 0 && (
        <div className="escalation-banner" style={{ background: '#fff7e6', borderColor: '#ffd591', color: '#d46b08' }}>
          <span>⚠️</span>
          <span>该工单已升级到第 {ticket.escalations[0].level} 级：{ticket.escalations[0].reason}</span>
        </div>
      )}

      <div className="detail-grid">
        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">基本信息</div>
            </div>
            <div className="card-body">
              <div className="form-row">
                <div className="detail-row">
                  <span className="detail-label">状态</span>
                  <span className="detail-value">
                    <span className={`badge badge-${ticket.status}`}>
                      {ticket.status === 'pending' ? '待派工' :
                       ticket.status === 'assigned' ? '已派工' :
                       ticket.status === 'in_progress' ? '维修中' :
                       ticket.status === 'completed' ? '已完成' : '已关闭'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">优先级</span>
                  <span className="detail-value">
                    <span className={`badge badge-${ticket.priority}`}>
                      {ticket.priority === 'urgent' ? '紧急' : 
                       ticket.priority === 'high' ? '高' : 
                       ticket.priority === 'normal' ? '普通' : '低'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="detail-row">
                  <span className="detail-label">分类</span>
                  <span className="detail-value">{ticket.category_name || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">创建人</span>
                  <span className="detail-value">{ticket.creator_name || '-'}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="detail-row">
                  <span className="detail-label">维修人员</span>
                  <span className="detail-value">{ticket.assignee_name || '未分派'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">联系电话</span>
                  <span className="detail-value">{ticket.assignee_phone || '-'}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="detail-row">
                  <span className="detail-label">预计工时</span>
                  <span className="detail-value">{ticket.estimated_hours ? `${ticket.estimated_hours} 小时` : '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">实际工时</span>
                  <span className="detail-value">{ticket.actual_hours ? `${ticket.actual_hours} 小时` : '-'}</span>
                </div>
              </div>

              <div className="form-row">
                <div className="detail-row">
                  <span className="detail-label">SLA 截止</span>
                  <span className="detail-value" style={{ color: ticket.is_overdue ? '#cf1322' : 'inherit' }}>
                    {ticket.sla_deadline ? dayjs(ticket.sla_deadline).format('YYYY-MM-DD HH:mm') : '-'}
                    {ticket.is_overdue && ' ⚠️ 已超时'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">回访状态</span>
                  <span className="detail-value">
                    {ticket.follow_up_done ? (
                      <span className="badge badge-completed">已回访 ({ticket.avg_satisfaction}⭐)</span>
                    ) : ticket.status === 'completed' ? (
                      <span className="badge badge-pending">待回访</span>
                    ) : (
                      <span style={{ color: '#999' }}>未到回访阶段</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="form-row">
                <div className="detail-row">
                  <span className="detail-label">创建时间</span>
                  <span className="detail-value">{dayjs(ticket.created_at).format('YYYY-MM-DD HH:mm')}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">完成时间</span>
                  <span className="detail-value">{ticket.completed_at ? dayjs(ticket.completed_at).format('YYYY-MM-DD HH:mm') : '-'}</span>
                </div>
              </div>

              {ticket.description && (
                <div className="detail-row" style={{ gridTemplateColumns: '100px 1fr' }}>
                  <span className="detail-label">问题描述</span>
                  <span className="detail-value">{ticket.description}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">业主信息</div>
            </div>
            <div className="card-body">
              <div className="form-row-3">
                <div className="detail-row">
                  <span className="detail-label">业主姓名</span>
                  <span className="detail-value">{ticket.owner_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">联系电话</span>
                  <span className="detail-value">{ticket.owner_phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">业主地址</span>
                  <span className="detail-value">{ticket.owner_address}</span>
                </div>
              </div>
            </div>
          </div>

          {ticket.materials?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">材料消耗</div>
              </div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>材料名称</th>
                      <th>单位</th>
                      <th>数量</th>
                      <th>单价</th>
                      <th>小计</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticket.materials.map((m, index) => (
                      <tr key={index}>
                        <td>{m.material_name}</td>
                        <td>{m.unit}</td>
                        <td>{m.quantity}</td>
                        <td>¥{m.unit_price}</td>
                        <td>¥{(m.quantity * m.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'right', fontWeight: 600 }}>合计：</td>
                      <td style={{ fontWeight: 600 }}>
                        ¥{ticket.materials.reduce((sum, m) => sum + m.quantity * m.unit_price, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {ticket.follow_ups?.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">质保回访记录</div>
              </div>
              <div className="card-body">
                {ticket.follow_ups.map((fu, index) => (
                  <div key={index} style={{
                    padding: '16px',
                    background: fu.satisfaction < 3 ? '#fff1f0' : '#fafafa',
                    border: fu.satisfaction < 3 ? '1px solid #ffa39e' : 'none',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: fu.satisfaction < 3 ? '#cf1322' : 'inherit' }}>
                        满意度：{'⭐'.repeat(fu.satisfaction || 0)}
                        {fu.satisfaction < 3 && (
                          <span className="badge badge-urgent" style={{ marginLeft: '8px' }}>
                            异常回访
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        {fu.operator_name} · {dayjs(fu.created_at).format('MM-DD HH:mm')}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '14px' }}>{fu.feedback || '无反馈'}</div>
                    {fu.satisfaction < 3 && ticket.escalations?.length > 0 && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff7e6', borderRadius: '4px', fontSize: '13px', color: '#d46b08' }}>
                        ⚠️ 已自动升级：{ticket.escalations.find(e => e.reason?.includes(`${fu.satisfaction}分`))?.reason || `低满意度（${fu.satisfaction}分）已触发升级流程`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">操作日志</div>
            </div>
            <div className="card-body">
              <div className="timeline">
                {ticket.logs?.map((log, index) => {
                  const isAbnormalFollowUp = log.action === 'followup' && log.remark?.includes('异常回访')
                  return (
                    <div key={index} className={`timeline-item ${isAbnormalFollowUp ? 'timeline-item-escalate' : `timeline-item-${log.action}`}`}>
                      <div className="timeline-content" style={isAbnormalFollowUp ? { background: '#fff1f0', border: '1px solid #ffa39e' } : {}}>
                        <div className="timeline-action" style={isAbnormalFollowUp ? { color: '#cf1322' } : {}}>
                          {getActionLabel(log.action, log.remark)}
                          {isAbnormalFollowUp && <span className="badge badge-urgent" style={{ marginLeft: '8px' }}>异常</span>}
                        </div>
                        {log.remark && <div className="timeline-remark">{log.remark}</div>}
                        <div className="timeline-meta">
                          {log.operator_name || '系统'} · {dayjs(log.created_at).format('MM-DD HH:mm')}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAssignModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">分派维修人员</div>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">选择维修人员</label>
                <select
                  className="form-select"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  <option value="">请选择</option>
                  {technicians?.data?.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowAssignModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={() => assignMutation.mutate()}
                disabled={!assigneeId || assignMutation.isLoading}
              >
                {assignMutation.isLoading ? '提交中...' : '确认派工'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCompleteModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">完成维修</div>
              <button className="modal-close" onClick={() => setShowCompleteModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">实际工时（小时）</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="请输入实际工时"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">材料消耗</label>
                {materials.map(mat => (
                  <div key={mat.id} className="material-item">
                    <span className="material-name">{mat.name}（{mat.unit}，¥{mat.unit_price}）</span>
                    <div className="material-qty">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="数量"
                        value={selectedMaterials.find(m => m.material_id === mat.id)?.quantity || ''}
                        onChange={(e) => handleMaterialChange(mat.id, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  className="form-textarea"
                  placeholder="请输入维修备注"
                  value={completeRemark}
                  onChange={(e) => setCompleteRemark(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowCompleteModal(false)}>取消</button>
              <button
                className="btn btn-success"
                onClick={() => completeMutation.mutate()}
                disabled={completeMutation.isLoading}
              >
                {completeMutation.isLoading ? '提交中...' : '确认完成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEscalateModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowEscalateModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">异常升级</div>
              <button className="modal-close" onClick={() => setShowEscalateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">升级级别</label>
                <select
                  className="form-select"
                  value={escalateLevel}
                  onChange={(e) => setEscalateLevel(parseInt(e.target.value))}
                >
                  <option value={1}>一级 - 班组长</option>
                  <option value={2}>二级 - 主管</option>
                  <option value={3}>三级 - 经理</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">升级原因</label>
                <textarea
                  className="form-textarea"
                  placeholder="请说明升级原因"
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowEscalateModal(false)}>取消</button>
              <button
                className="btn btn-danger"
                onClick={() => escalateMutation.mutate()}
                disabled={!escalateReason || escalateMutation.isLoading}
              >
                {escalateMutation.isLoading ? '提交中...' : '确认升级'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFollowUpModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowFollowUpModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">质保回访</div>
              <button className="modal-close" onClick={() => setShowFollowUpModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">满意度评分</label>
                <div className="rating-stars" style={{ marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${star <= followUpSatisfaction ? 'active' : ''}`}
                      onClick={() => setFollowUpSatisfaction(star)}
                      style={{ cursor: 'pointer', fontSize: '32px' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '14px', color: followUpSatisfaction < 3 ? '#cf1322' : '#666' }}>
                  {followUpSatisfaction === 1 && '非常不满意'}
                  {followUpSatisfaction === 2 && '不满意'}
                  {followUpSatisfaction === 3 && '一般'}
                  {followUpSatisfaction === 4 && '满意'}
                  {followUpSatisfaction === 5 && '非常满意'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">
                  回访反馈{followUpSatisfaction < 3 ? ' *' : ''}
                </label>
                <textarea
                  className="form-textarea"
                  placeholder={followUpSatisfaction < 3 
                    ? '满意度低于3分，必须填写反馈原因，提交后将自动生成升级记录' 
                    : '请输入业主反馈意见'}
                  value={followUpFeedback}
                  onChange={(e) => setFollowUpFeedback(e.target.value)}
                  style={{ 
                    borderColor: followUpSatisfaction < 3 && (!followUpFeedback || !followUpFeedback.trim()) ? '#ff4d4f' : undefined 
                  }}
                />
                {followUpSatisfaction < 3 && (!followUpFeedback || !followUpFeedback.trim()) && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                    满意度低于3分时，反馈原因为必填项
                  </div>
                )}
              </div>
              {followUpSatisfaction < 3 && (
                <div style={{
                  padding: '12px',
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: '6px',
                  color: '#cf1322',
                  fontSize: '14px',
                }}>
                  ⚠️ 满意度低于3分，提交后将自动处理：
                  <ul style={{ margin: '8px 0 0 20px' }}>
                    <li>生成异常升级记录（1分→三级升级，2分→二级升级）</li>
                    <li>工单详情将显示异常回访标记</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowFollowUpModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={() => followUpMutation.mutate()}
                disabled={followUpMutation.isLoading}
              >
                {followUpMutation.isLoading ? '提交中...' : '提交回访'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowCloseModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">关闭工单</div>
              <button className="modal-close" onClick={() => setShowCloseModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">关闭备注</label>
                <textarea
                  className="form-textarea"
                  placeholder="请输入关闭备注（可选）"
                  value={closeRemark}
                  onChange={(e) => setCloseRemark(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowCloseModal(false)}>取消</button>
              <button
                className="btn btn-primary"
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isLoading}
              >
                {closeMutation.isLoading ? '提交中...' : '确认关闭'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketDetail
