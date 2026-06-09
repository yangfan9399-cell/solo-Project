import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
})

const roleLabelMap: Record<string, string> = {
  QUALITY_MANAGER: '质量经办人',
  STORE_PHARMACIST: '门店药师',
  LOGISTICS_STAFF: '物流人员',
  REVIEWER: '复核人',
}

function RootComponent() {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser)
        setCurrentUser(parsed)
      } catch (e) {
        console.error('Failed to parse saved user', e)
      }
    }
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value
    if (!userId) {
      localStorage.removeItem('currentUser')
      setCurrentUser(null)
      return
    }
    const user = users.find(u => u.id === userId)
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
      setCurrentUser(user)
    }
  }

  const navItems = [
    { to: '/', label: '召回列表' },
    { to: '/analytics', label: '复盘统计' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-blue-600">
                🏥 药企召回管理系统
              </h1>
              <nav className="flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.to
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <UserRoleSelector
                currentUser={currentUser}
                users={users}
                loading={loadingUsers}
                onUserChange={handleUserChange}
              />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

function UserRoleSelector({
  currentUser,
  users,
  loading,
  onUserChange,
}: {
  currentUser: any
  users: any[]
  loading: boolean
  onUserChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}) {
  const groupedUsers = users.reduce((acc: Record<string, any[]>, user) => {
    if (!acc[user.role]) {
      acc[user.role] = []
    }
    acc[user.role].push(user)
    return acc
  }, {})

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">当前用户:</span>
      <select
        value={currentUser?.id || ''}
        onChange={onUserChange}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white min-w-[180px]"
        disabled={loading}
      >
        <option value="">选择用户</option>
        {Object.entries(groupedUsers).map(([role, roleUsers]) => (
          <optgroup key={role} label={roleLabelMap[role] || role}>
            {roleUsers.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.name}
                {user.store ? `（${user.store.name}）` : ''}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {currentUser && (
        <span className="text-xs text-gray-400">
          {roleLabelMap[currentUser.role]}
        </span>
      )}
    </div>
  )
}
