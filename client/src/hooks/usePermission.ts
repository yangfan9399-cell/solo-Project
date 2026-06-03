import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

export function usePermission() {
  const { user, isAuthenticated } = useAuthStore();

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    return allowedRoles.includes(user.role);
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isProducer = (): boolean => hasRole('producer');
  const isReporter = (): boolean => hasRole('reporter');

  const canApprove = (): boolean => hasRole(['admin', 'producer']);
  const canManageEquipment = (): boolean => hasRole('admin');
  const canManageUsers = (): boolean => hasRole('admin');
  const canCreateTask = (): boolean => hasRole(['admin', 'reporter']);
  const canCreateReservation = (): boolean => hasRole(['admin', 'reporter']);
  const canReportDamage = (): boolean => hasRole(['admin', 'reporter']);
  const canHandlePickupReturn = (): boolean => hasRole('admin');
  const canManageMediaCards = (): boolean => hasRole('admin');
  const canBorrowMediaCards = (): boolean => hasRole(['admin', 'reporter', 'producer']);

  return {
    user,
    isAuthenticated,
    hasRole,
    isAdmin,
    isProducer,
    isReporter,
    canApprove,
    canManageEquipment,
    canManageUsers,
    canCreateTask,
    canCreateReservation,
    canReportDamage,
    canHandlePickupReturn,
    canManageMediaCards,
    canBorrowMediaCards,
  };
}

export default usePermission;
