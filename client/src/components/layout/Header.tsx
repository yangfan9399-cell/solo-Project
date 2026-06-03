import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  const { user } = useAuthStore();

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4">
          {actions}
          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <span className={`badge ${ROLE_COLORS[user.role]} text-xs`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </div>
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">{user.name.charAt(0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
