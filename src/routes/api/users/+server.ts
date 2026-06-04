import { json } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const users = await prisma.user.findMany({
    orderBy: { role: 'asc' }
  });
  return json(users);
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  const user = await prisma.user.create({
    data: {
      name: data.name,
      role: data.role
    }
  });
  return json(user);
};
