import { create } from 'zustand'

interface AppState {
  currentUser: { id: string; displayName: string; role: string }
  sidebarCollapsed: boolean
  setCurrentUser: (user: { id: string; displayName: string; role: string }) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: '1',
    displayName: '张明远',
    role: '读者服务馆员',
  },
  sidebarCollapsed: false,
  setCurrentUser: (user) => set({ currentUser: user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
