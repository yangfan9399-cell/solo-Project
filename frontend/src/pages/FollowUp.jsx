import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ticketsAPI, followUpsAPI } from '../api/index.js'
import dayjs from 'dayjs'

function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <div>加载中...</div>
    </div>
  )
}

function FollowUp({ currentUser }) {
  const queryClient = useQueryClient()
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [satisfaction, setSatisfaction] = useState(5)
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)

  const { data: pendingFollowUps, isLoading } = useQuery({
    queryKey: ['pendingFollowUps'],
    queryFn: () => followUpsAPI.getPending(),
  })

  const { data: completedTickets } = useQuery({
    queryKey: ['completedTickets'],
    queryFn: () => ticketsAPI.getAll({ status: 'completed' }),
  })

  const followUpMutation = useMutation({
    mutationFn: ({ ticketId, satisfaction, feedback }) => ticketsAPI.addFollowUp(ticketId, {
      operator_id: 1,
      satisfaction,
      feedback,
      follow_up_date: new Date().toISOString(),
      status: 'completed',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingFollowUps'])
      queryClient.invalidateQueries(['completedTickets'])
      setShowModal(false)
      setSelectedTicket(null)
      setFeedback('')
      setSatisfaction(5)
    },
  })

  const handleSubmit = () => {
    if (!selectedTicket) return
    followUpMutation.mutate({
      ticketId: selectedTicket.id,
      satisfaction,
      feedback,
    })
  }

  if (isLoading) return <Loading />

  const ticketsToFollowUp = completedTickets?.data?.filter(t => 
    !t.follow_up_done
  ) || []

  const followUpDoneTickets = completedTickets?.data?.filter(t => 
    t.follow_up_done
  ) || []

  const avgSatisfaction = followUpDoneTickets.length > 0
    ? (followUpDoneTickets.reduce((sum, t) => sum + (t.avg_satisfaction || 0), 0) / followUpDoneTickets.length).toFixed(1)
    : '-'

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">质保回访管理</h1>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card stat-card-warning">
          <div className="stat-card-value">{ticketsToFollowUp.length}</div>
          <div className="stat-card-label">待回访工单</div>
        </div>
        <div className="stat-card stat-card-success">
          <div className="stat-card-value">{followUpDoneTickets.length}</div>
          <div className="stat-card-label">已完成回访</div>
        </div>
        <div className="stat-card stat-card-info">
          <div className="stat-card-value">{avgSatisfaction}⭐</div>
          <div className="stat-card-label">平均满意度</div>
        </div>
        <div className="stat-card stat-card-primary">
          <div className="stat-card-value">{completedTickets?.data?.length || 0}</div>
          <div className="stat-card-label">完工单总数</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">待回访工单</div>
        </div>
        <div className="card-body">
          {ticketsToFollowUp.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <div>所有已完工单都已完成回访</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>标题</th>
                  <th>业主</th>
                  <th>联系电话</th>
                  <th>地址</th>
                  <th>维修人员</th>
                  <th>完成时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {ticketsToFollowUp.map(ticket => (
                  <tr key={ticket.id}>
                    <td><span className="tag">{ticket.ticket_no}</span></td>
                    <td>{ticket.title}</td>
                    <td>{ticket.owner_name}</td>
                    <td>{ticket.owner_phone}</td>
                    <td>{ticket.owner_address}</td>
                    <td>{ticket.assignee_name || '-'}</td>
                    <td>{dayjs(ticket.completed_at).format('YYYY-MM-DD')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedTicket(ticket)
                            setShowModal(true)
                          }}
                        >
                          回访
                        </button>
                        <Link to={`/tickets/${ticket.id}`} className="btn btn-default btn-sm">
                          详情
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {followUpDoneTickets.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">已完成回访</div>
          </div>
          <div className="card-body">
            <table className="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>标题</th>
                  <th>业主</th>
                  <th>维修人员</th>
                  <th>完成时间</th>
                  <th>满意度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {followUpDoneTickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td><span className="tag">{ticket.ticket_no}</span></td>
                    <td>{ticket.title}</td>
                    <td>{ticket.owner_name}</td>
                    <td>{ticket.assignee_name || '-'}</td>
                    <td>{dayjs(ticket.completed_at).format('YYYY-MM-DD')}</td>
                    <td>
                      <span className="badge badge-completed">
                        {'⭐'.repeat(Math.round(ticket.avg_satisfaction || 0))}
                        {' '}{ticket.avg_satisfaction}分
                      </span>
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="link-text">详情</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">回访注意事项</div>
        </div>
        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }}>
            <div style={{
              padding: '16px',
              background: '#f6ffed',
              borderRadius: '8px',
              border: '1px solid #b7eb8f',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#389e0d' }}>
                📞 电话回访
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                <li>确认维修质量是否符合预期</li>
                <li>询问是否有其他问题需要解决</li>
                <li>了解维修人员服务态度和及时性</li>
                <li>提醒质保期内可免费返修</li>
              </ul>
            </div>
            <div style={{
              padding: '16px',
              background: '#fff7e6',
              borderRadius: '8px',
              border: '1px solid #ffd591',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px', color: '#d46b08' }}>
                ⚠️ 异常处理
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#666' }}>
                <li>满意度低于3分时需记录具体原因</li>
                <li>涉及返工的工单需立即重新派工</li>
                <li>严重投诉需升级到主管处理</li>
                <li>回访异常需生成异常处理单</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedTicket && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title">质保回访 - {selectedTicket.ticket_no}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '6px',
                marginBottom: '20px',
              }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedTicket.title}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  业主：{selectedTicket.owner_name} · {selectedTicket.owner_phone}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  地址：{selectedTicket.owner_address}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">满意度评分</label>
                <div className="rating-stars" style={{ marginBottom: '8px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span
                      key={star}
                      className={`star ${star <= satisfaction ? 'active' : ''}`}
                      onClick={() => setSatisfaction(star)}
                      style={{ cursor: 'pointer', fontSize: '32px' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {satisfaction === 1 && '非常不满意'}
                  {satisfaction === 2 && '不满意'}
                  {satisfaction === 3 && '一般'}
                  {satisfaction === 4 && '满意'}
                  {satisfaction === 5 && '非常满意'}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">回访反馈</label>
                <textarea
                  className="form-textarea"
                  placeholder="请输入业主反馈意见，如满意度较低请记录具体原因..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  style={{ minHeight: '120px' }}
                />
              </div>

              {satisfaction <= 2 && (
                <div style={{
                  padding: '12px',
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: '6px',
                  color: '#cf1322',
                  fontSize: '14px',
                }}>
                  ⚠️ 满意度较低，建议：
                  <ul style={{ margin: '8px 0 0 20px' }}>
                    <li>详细记录业主不满意的具体原因</li>
                    <li>确认是否需要安排返工或进一步处理</li>
                    <li>必要时升级到班组长或主管处理</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-default" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={followUpMutation.isLoading}
              >
                {followUpMutation.isLoading ? '提交中...' : '提交回访'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FollowUp
