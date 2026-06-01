import { create } from 'zustand'

export type UserRole = 'librarian' | 'partner' | 'supervisor'

export const roleLabels: Record<UserRole, string> = {
  librarian: '读者服务馆员',
  partner: '合作馆联系人',
  supervisor: '流通部主管',
}

interface AppState {
  currentUser: { id: string; displayName: string; role: string }
  currentRole: UserRole
  sidebarCollapsed: boolean
  setCurrentUser: (user: { id: string; displayName: string; role: string }) => void
  setCurrentRole: (role: UserRole) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: '1',
    displayName: '张明远',
    role: '读者服务馆员',
  },
  currentRole: 'librarian',
  sidebarCollapsed: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentRole: (role) => set({ currentRole: role }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
