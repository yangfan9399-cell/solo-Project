import { json, type RequestHandler } from '@sveltejs/kit';
import prisma from '$lib/server/prisma';
import { StaffRole } from '@prisma/client';

export const GET: RequestHandler = async ({ url }) => {
  const role = url.searchParams.get('role') as StaffRole | null;
  const region = url.searchParams.get('region');

  const where: any = {};
  if (role) where.role = role;
  if (region) where.region = region;

  const staff = await prisma.staff.findMany({
    where,
    orderBy: { name: 'asc' }
  });

  return json(staff);
};
