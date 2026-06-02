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
  login: (role: UserRole) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const roleEmailMap: Record<UserRole, string> = {
  [UserRole.DORM_MANAGER]: 'admin@dorm.com',
  [UserRole.MAINTENANCE_WORKER]: 'worker1@dorm.com',
  [UserRole.ENERGY_ADMIN]: 'energy@dorm.com',
  [UserRole.STUDENT]: 'student1@dorm.com',
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function fetchUserByRole(role: UserRole): Promise<AuthUser | null> {
  const email = roleEmailMap[role]
  try {
    const response = await fetch(`/api/user?email=${encodeURIComponent(email)}`)
    if (response.ok) {
      const data = await response.json()
      return data.user || null
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedRole = localStorage.getItem('authRole') as UserRole | null
      if (savedRole && Object.values(UserRole).includes(savedRole)) {
        const fetchedUser = await fetchUserByRole(savedRole)
        if (fetchedUser) {
          setUser(fetchedUser)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (role: UserRole) => {
    const fetchedUser = await fetchUserByRole(role)
    if (fetchedUser) {
      setUser(fetchedUser)
      localStorage.setItem('authRole', role)
    }
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
