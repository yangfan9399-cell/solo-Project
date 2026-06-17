import type { APIRoute } from 'astro';
import { getAllUnits, createUnit, updateUnit, deleteUnit } from '../../../../lib/units';

export const GET: APIRoute = async ({ params }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const units = getAllUnits(projectId);
    return new Response(JSON.stringify(units), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch units' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const body = await request.json();
    const unit = createUnit({
      ...body,
      projectId
    });
    return new Response(JSON.stringify(unit), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create unit' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { unitId, ...data } = body;
    if (!unitId) {
      return new Response(JSON.stringify({ error: 'Unit ID required' }), { status: 400 });
    }
    const updated = updateUnit(unitId, data);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Unit not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update unit' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { unitId } = body;
    if (!unitId) {
      return new Response(JSON.stringify({ error: 'Unit ID required' }), { status: 400 });
    }
    const success = deleteUnit(unitId);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Unit not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete unit' }), { status: 500 });
  }
};
