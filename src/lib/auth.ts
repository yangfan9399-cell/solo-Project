'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string | null
  role: UserRole
  avatar?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  login: (role: UserRole) => void
  logout: () => void
  isLoading: boolean
}

const mockUsers: Record<UserRole, AuthUser> = {
  [UserRole.DORM_MANAGER]: {
    id: 'dorm-manager-1',
    email: 'admin@dorm.com',
    name: '张管理员',
    phone: '13800138001',
    role: UserRole.DORM_MANAGER,
  },
  [UserRole.MAINTENANCE_WORKER]: {
    id: 'worker-1',
    email: 'worker1@dorm.com',
    name: '李师傅',
    phone: '13800138002',
    role: UserRole.MAINTENANCE_WORKER,
  },
  [UserRole.ENERGY_ADMIN]: {
    id: 'energy-1',
    email: 'energy@dorm.com',
    name: '刘能源',
    phone: '13800138004',
    role: UserRole.ENERGY_ADMIN,
  },
  [UserRole.STUDENT]: {
    id: 'student-1',
    email: 'student1@dorm.com',
    name: '学生小明',
    phone: '13800138005',
    role: UserRole.STUDENT,
  },
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedRole = localStorage.getItem('authRole') as UserRole | null
    if (savedRole && mockUsers[savedRole]) {
      setUser(mockUsers[savedRole])
    }
    setIsLoading(false)
  }, [])

  const login = (role: UserRole) => {
    const selectedUser = mockUsers[role]
    setUser(selectedUser)
    localStorage.setItem('authRole', role)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('authRole')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
