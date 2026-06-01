import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Dashboard from './pages/Dashboard.jsx'
import TicketList from './pages/TicketList.jsx'
import TicketDetail from './pages/TicketDetail.jsx'
import Kanban from './pages/Kanban.jsx'
import FollowUp from './pages/FollowUp.jsx'

const userRoles = {
  1: { role: 'customer_service', name: '张客服' },
  2: { role: 'team_leader', name: '李班长' },
  3: { role: 'manager', name: '王经理' },
}

function App() {
  const [currentUser, setCurrentUser] = useState(userRoles[1])
  const navigate = useNavigate()

  const handleUserChange = (userId) => {
    setCurrentUser(userRoles[userId])
  }

  const getNavItems = () => {
    const items = [
      { to: '/', label: '工作台', icon: '📊' },
      { to: '/tickets', label: '报修单', icon: '📋' },
      { to: '/kanban', label: '派工看板', icon: '📌' },
    ]
    
    if (['customer_service', 'manager'].includes(currentUser.role)) {
      items.push({ to: '/followups', label: '质保回访', icon: '📞' })
    }
    
    return items
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <span>🏠</span>
            <span>物业维修管理系统</span>
          </div>
          
          <nav className="header-nav">
            {getNavItems().map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {item.icon} {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="header-user">
            <span>当前角色：</span>
            <select
              value={Object.entries(userRoles).find(([k, v]) => v.role === currentUser.role)?.[0] || 1}
              onChange={(e) => handleUserChange(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
              }}
            >
              {Object.entries(userRoles).map(([id, user]) => (
                <option key={id} value={id} style={{ color: '#333' }}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard currentUser={currentUser} />} />
          <Route path="/tickets" element={<TicketList currentUser={currentUser} />} />
          <Route path="/tickets/:id" element={<TicketDetail currentUser={currentUser} />} />
          <Route path="/kanban" element={<Kanban currentUser={currentUser} />} />
          <Route path="/followups" element={<FollowUp currentUser={currentUser} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
