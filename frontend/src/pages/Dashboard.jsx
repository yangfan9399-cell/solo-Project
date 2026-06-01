import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { dashboardAPI, ticketsAPI, categoriesAPI, usersAPI } from '../api/index.js'
import dayjs from 'dayjs'
import TicketForm from '../components/TicketForm.jsx'

function Loading() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <div>加载中...</div>
    </div>
  )
}

function Dashboard({ currentUser }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardAPI.getStats(),
  })

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['recentTickets'],
    queryFn: () => ticketsAPI.getAll({}),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  })

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersAPI.getTechnicians(),
  })

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    queryClient.invalidateQueries(['recentTickets'])
    queryClient.invalidateQueries(['dashboardStats'])
    queryClient.invalidateQueries(['tickets'])
  }

  if (statsLoading || ticketsLoading) {
    return <Loading />
  }

  const statsData = stats?.data || {}
  const tickets = recentTickets?.data?.slice(0, 8) || []

  const statCards = [
    { label: '今日新增', value: statsData.today || 0, color: 'primary', icon: '📅' },
    { label: '待派工', value: statsData.pending || 0, color: 'warning', icon: '⏳' },
    { label: '已派工', value: statsData.assigned || 0, color: 'primary', icon: '📋' },
    { label: '维修中', value: statsData.in_progress || 0, color: 'success', icon: '🔧' },
    { label: '已完成', value: statsData.completed || 0, color: 'info', icon: '✅' },
    { label: '紧急工单', value: statsData.urgent || 0, color: 'danger', icon: '🚨' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工作台</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ 新建报修
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className={`stat-card stat-card-${stat.color}`}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">最近工单</div>
          <Link to="/tickets" className="link-text">查看全部 →</Link>
        </div>
        <div className="card-body">
          {tickets.length === 0 ? (
            <div className="empty">暂无工单数据</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>标题</th>
                  <th>业主</th>
                  <th>地址</th>
                  <th>分类</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => (
                  <tr key={ticket.id}>
                    <td><span className="tag">{ticket.ticket_no}</span></td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.title}
                    </td>
                    <td>{ticket.owner_name}</td>
                    <td>{ticket.owner_address}</td>
                    <td>{ticket.category_name || '-'}</td>
                    <td>
                      <span className={`badge badge-${ticket.priority}`}>
                        {ticket.priority === 'urgent' ? '紧急' : ticket.priority === 'high' ? '高' : ticket.priority === 'normal' ? '普通' : '低'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.status}`}>
                        {ticket.status === 'pending' ? '待派工' :
                         ticket.status === 'assigned' ? '已派工' :
                         ticket.status === 'in_progress' ? '维修中' :
                         ticket.status === 'completed' ? '已完成' : '已关闭'}
                      </span>
                    </td>
                    <td>{dayjs(ticket.created_at).format('MM-DD HH:mm')}</td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="link-text">详情</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {statsData.by_technician && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">维修人员工作量</div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {statsData.by_technician.map(tech => (
                <div key={tech.id} style={{
                  padding: '16px',
                  background: '#fafafa',
                  borderRadius: '8px',
                  border: '1px solid #f0f0f0',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                    👤 {tech.name}
                  </div>
                  <div style={{ display: 'flex', gap: '24px', fontSize: '14px' }}>
                    <div>
                      <span style={{ color: '#666' }}>总工单：</span>
                      <span style={{ fontWeight: 600 }}>{tech.total}</span>
                    </div>
                    <div>
                      <span style={{ color: '#666' }}>进行中：</span>
                      <span style={{ fontWeight: 600, color: '#52c41a' }}>{tech.in_progress}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <TicketForm
          categories={categories?.data || []}
          technicians={technicians?.data || []}
          currentUser={currentUser}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}

export default Dashboard
