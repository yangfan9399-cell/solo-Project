import { createContextId, useContextProvider, useStore, useContext, $, type QRL } from '@builder.io/qwik';
import type { UserRole, UserRoleLabels } from '~/types';

interface AuthState {
  currentRole: UserRole;
  currentUserName: string;
}

interface AuthContext {
  state: AuthState;
  switchRole: QRL<(role: UserRole) => void>;
}

export const AuthContext = createContextId<AuthContext>('auth-context');

export function useAuthProvider() {
  const state = useStore<AuthState>({
    currentRole: 'cold_chain_admin',
    currentUserName: '张冷链',
  });

  const switchRole = $((role: UserRole) => {
    state.currentRole = role;
    const names: Record<UserRole, string> = {
      cold_chain_admin: '张冷链',
      cdc_reviewer: '李疾控',
      vaccination_site_manager: '王接种',
    };
    state.currentUserName = names[role];
  });

  useContextProvider(AuthContext, { state, switchRole });
}

export function useAuth() {
  return useContext(AuthContext);
}
