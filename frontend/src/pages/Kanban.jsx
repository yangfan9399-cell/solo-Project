import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ticketsAPI, usersAPI } from '../api/index.js'
import dayjs from 'dayjs'

function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <div>加载中...</div>
    </div>
  )
}

function Kanban({ currentUser }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedAssignee, setSelectedAssignee] = useState('')

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersAPI.getTechnicians(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', selectedAssignee],
    queryFn: () => ticketsAPI.getAll(selectedAssignee ? { assignee_id: selectedAssignee } : {}),
  })

  const assignMutation = useMutation({
    mutationFn: ({ ticketId, assigneeId }) => ticketsAPI.assign(ticketId, { assignee_id: assigneeId, operator_id: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tickets'])
    },
  })

  if (isLoading) return <Loading />

  const tickets = data?.data || []

  const columns = [
    { key: 'pending', label: '待派工', color: '#fa8c16' },
    { key: 'assigned', label: '已派工', color: '#1890ff' },
    { key: 'in_progress', label: '维修中', color: '#52c41a' },
    { key: 'completed', label: '已完成', color: '#2f54eb' },
    { key: 'closed', label: '已关闭', color: '#8c8c8c' },
  ]

  const groupedTickets = {}
  columns.forEach(col => {
    groupedTickets[col.key] = tickets.filter(t => t.status === col.key)
  })

  const handleDragStart = (e, ticket) => {
    e.dataTransfer.setData('ticket', JSON.stringify(ticket))
  }

  const handleDrop = (e, targetStatus) => {
    e.preventDefault()
    const ticket = JSON.parse(e.dataTransfer.getData('ticket'))
    
    if (ticket.status === 'pending' && targetStatus === 'assigned') {
      const firstTech = technicians?.data?.[0]
      if (firstTech) {
        assignMutation.mutate({ ticketId: ticket.id, assigneeId: firstTech.id })
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">派工看板</h1>
        <div className="filter-bar" style={{ margin: 0 }}>
          <div className="filter-item">
            <label>维修人员：</label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            >
              <option value="">全部</option>
              {technicians?.data?.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="kanban">
        {columns.map(col => (
          <div
            key={col.key}
            className="kanban-column"
            onDrop={(e) => handleDrop(e, col.key)}
            onDragOver={handleDragOver}
          >
            <div className="kanban-column-header" style={{ borderBottomColor: col.color }}>
              <span>{col.label}</span>
              <span className="kanban-column-count">{groupedTickets[col.key]?.length || 0}</span>
            </div>
            <div className="kanban-cards">
              {groupedTickets[col.key]?.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#bbb',
                  fontSize: '14px',
                }}>
                  暂无工单
                </div>
              ) : (
                groupedTickets[col.key].map(ticket => (
                  <div
                    key={ticket.id}
                    className={`kanban-card kanban-card-${ticket.priority}`}
                    draggable={ticket.status === 'pending'}
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="kanban-card-title">{ticket.title}</div>
                    <div className="kanban-card-meta">
                      <span>{ticket.ticket_no}</span>
                      <span>{ticket.owner_name}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      {ticket.assignee_name || '未分派'} · {dayjs(ticket.created_at).format('MM-DD')}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span className={`badge badge-${ticket.priority}`} style={{ marginRight: '4px' }}>
                        {ticket.priority === 'urgent' ? '紧急' :
                         ticket.priority === 'high' ? '高' :
                         ticket.priority === 'normal' ? '普通' : '低'}
                      </span>
                      {ticket.category_name && (
                        <span className="tag">{ticket.category_name}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <div className="card-title">维修人员工作量</div>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {technicians?.data?.map(tech => {
              const techTickets = tickets.filter(t => t.assignee_id === tech.id)
              const inProgress = techTickets.filter(t => t.status === 'in_progress').length
              const pending = techTickets.filter(t => t.status === 'assigned').length
              
              return (
                <div key={tech.id} style={{
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👤</span>
                    <span>{tech.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>待处理</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#fa8c16' }}>{pending}</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>进行中</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#52c41a' }}>{inProgress}</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '12px' }}>总工单</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#1890ff' }}>{techTickets.length}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Kanban
