'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { Role } from '@/lib/types'

interface RoleContextType {
  currentRole: Role
  setCurrentRole: (role: Role) => void
  currentUserId: string
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<Role>(Role.WAREHOUSE_CLERK)

  const getUserIdByRole = (role: Role): string => {
    switch (role) {
      case Role.WAREHOUSE_CLERK:
        return 'user-clerk'
      case Role.QUALITY_MANAGER:
        return 'user-qa'
      case Role.REVIEWER:
        return 'user-reviewer'
      default:
        return 'user-clerk'
    }
  }

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentUserId: getUserIdByRole(currentRole),
      }}
    >
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider')
  }
  return context
}
