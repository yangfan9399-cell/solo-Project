import { createContext, useContext, useState, useMemo } from 'react';
import type { UserRole } from '../types';

interface RoleContextType {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  roleLabels: Record<UserRole, string>;
  roleAvatars: Record<UserRole, string>;
}

const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  chemist: '化验员',
  repair_crew: '抢修队',
  hotline: '热线客服',
};

const roleAvatars: Record<UserRole, string> = {
  admin: '管',
  chemist: '化',
  repair_crew: '修',
  hotline: '热',
};

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  const value = useMemo(() => ({
    currentRole,
    setCurrentRole,
    roleLabels,
    roleAvatars,
  }), [currentRole]);

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
