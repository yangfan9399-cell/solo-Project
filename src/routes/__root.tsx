import { createRootRoute, Outlet, Link, useLocation } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser))
    }
  }, [])

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
              <UserRoleSelector currentUser={currentUser} onUserChange={setCurrentUser} />
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

function UserRoleSelector({ currentUser, onUserChange }: { currentUser: any; onUserChange: (user: any) => void }) {
  const users = [
    { id: 'qm', name: '张质量', role: 'QUALITY_MANAGER', roleLabel: '质量经办人' },
    { id: 'rv', name: '李复核', role: 'REVIEWER', roleLabel: '复核人' },
    { id: 'ls', name: '王物流', role: 'LOGISTICS_STAFF', roleLabel: '物流人员' },
    { id: 'sp', name: '陈药师', role: 'STORE_PHARMACIST', roleLabel: '门店药师' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value
    const user = users.find(u => u.id === userId)
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user))
      onUserChange(user)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">当前用户:</span>
      <select
        value={currentUser?.id || ''}
        onChange={handleChange}
        className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white"
      >
        <option value="">选择用户</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.roleLabel})
          </option>
        ))}
      </select>
    </div>
  )
}
