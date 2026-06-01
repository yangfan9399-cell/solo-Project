import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ticketsAPI, categoriesAPI, usersAPI } from '../api/index.js'
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

function TicketList({ currentUser }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category_id: '',
    search: '',
  })
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll(),
  })

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => usersAPI.getTechnicians(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', filters],
    queryFn: () => ticketsAPI.getAll(filters),
  })

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    queryClient.invalidateQueries(['tickets'])
  }

  if (isLoading) return <Loading />
  if (error) return <div className="error">加载失败：{error.message}</div>

  const tickets = data?.data || []

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">报修单管理</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ 新建报修
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="filter-bar">
            <div className="filter-item">
              <label>状态：</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">全部</option>
                <option value="pending">待派工</option>
                <option value="assigned">已派工</option>
                <option value="in_progress">维修中</option>
                <option value="completed">已完成</option>
                <option value="closed">已关闭</option>
              </select>
            </div>

            <div className="filter-item">
              <label>优先级：</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">全部</option>
                <option value="urgent">紧急</option>
                <option value="high">高</option>
                <option value="normal">普通</option>
                <option value="low">低</option>
              </select>
            </div>

            <div className="filter-item">
              <label>分类：</label>
              <select
                value={filters.category_id}
                onChange={(e) => handleFilterChange('category_id', e.target.value)}
              >
                <option value="">全部</option>
                {categories?.data?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>搜索：</label>
              <input
                type="text"
                placeholder="工单号/标题/业主"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <button
              className="btn btn-default btn-sm"
              onClick={() => setFilters({ status: '', priority: '', category_id: '', search: '' })}
            >
              重置
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="empty">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div>暂无报修单数据</div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>工单号</th>
                  <th>标题</th>
                  <th>业主信息</th>
                  <th>分类</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>维修人员</th>
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
                    <td>
                      <div>{ticket.owner_name}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>{ticket.owner_phone}</div>
                    </td>
                    <td>{ticket.category_name || '-'}</td>
                    <td>
                      <span className={`badge badge-${ticket.priority}`}>
                        {ticket.priority === 'urgent' ? '紧急' : 
                         ticket.priority === 'high' ? '高' : 
                         ticket.priority === 'normal' ? '普通' : '低'}
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
                    <td>{ticket.assignee_name || '-'}</td>
                    <td>{dayjs(ticket.created_at).format('MM-DD HH:mm')}</td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="link-text">查看</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

export default TicketList
