'use client'

import { RoleProvider } from '@/context/RoleContext'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return <RoleProvider>{children}</RoleProvider>
}
