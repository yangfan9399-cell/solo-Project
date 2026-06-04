import { writable } from 'svelte/store';
import type { Role } from '@prisma/client';

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
}

function createUserStore() {
  const { subscribe, set } = writable<CurrentUser | null>(null);

  return {
    subscribe,
    set,
    clear: () => set(null)
  };
}

export const currentUser = createUserStore();
