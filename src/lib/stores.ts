import { writable } from 'svelte/store';
import type { UserRole } from './types';

export const currentUser = writable<{ id: string; name: string; role: UserRole; department: string }>({
  id: '',
  name: '',
  role: 'FRONTLINE',
  department: ''
});

export const allUsers = writable<{ id: string; name: string; role: UserRole; department: string }[]>([]);

export async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    if (res.ok) {
      const users = await res.json();
      allUsers.set(users);
      const current = currentUser;
      let currentVal: { id: string; name: string; role: UserRole; department: string } | undefined;
      current.subscribe(v => currentVal = v)();
      if (!currentVal?.id && users.length > 0) {
        const frontline = users.find((u: any) => u.role === 'FRONTLINE');
        if (frontline) {
          currentUser.set({ id: frontline.id, name: frontline.name, role: frontline.role, department: frontline.department });
        }
      }
    }
  } catch (e) {
    console.error('Failed to load users', e);
  }
}
