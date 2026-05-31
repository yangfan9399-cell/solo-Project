import { component$ } from '@builder.io/qwik';
import { useAuth } from '~/context/auth';
import { User, ChevronDown } from 'lucide-qwik';
import type { UserRole } from '~/types';
import { UserRoleLabels } from '~/types';

export const Header = component$(() => {
  const { state, switchRole } = useAuth();

  return (
    <header class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">欢迎回来，{state.currentUserName}</h2>
          <p class="text-sm text-gray-500">当前角色: {UserRoleLabels[state.currentRole as UserRole]}</p>
        </div>
        
        <div class="flex items-center space-x-4">
          <div class="relative group">
            <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              <User class="w-5 h-5 text-gray-600" />
              <span class="text-gray-700">切换角色</span>
              <ChevronDown class="w-4 h-4 text-gray-500" />
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
              {(['cold_chain_admin', 'cdc_reviewer', 'vaccination_site_manager'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  onClick$={() => switchRole(role)}
                  class={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    state.currentRole === role ? 'bg-primary-50 text-primary-600' : 'text-gray-700'
                  }`}
                >
                  {UserRoleLabels[role]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
