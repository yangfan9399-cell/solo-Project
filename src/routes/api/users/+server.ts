import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsers } from '$lib/services/recordService';

export const GET: RequestHandler = async () => {
  try {
    const users = await getUsers();
    return json(users);
  } catch (e) {
    console.error('Error fetching users:', e);
    throw error(500, 'Failed to fetch users');
  }
};
