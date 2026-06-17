import type { APIRoute } from 'astro';
import { getRelationsByProject, createRelation, deleteRelation, updateRelation, createBidirectionalRelation } from '../../../../lib/relations';

export const GET: APIRoute = async ({ params }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const relations = getRelationsByProject(projectId);
    return new Response(JSON.stringify(relations), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch relations' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const body = await request.json();
    const { bidirectional = true, ...relData } = body;
    
    let relation;
    if (bidirectional) {
      relation = createBidirectionalRelation(
        projectId,
        relData.fromUnitId,
        relData.toUnitId,
        relData.relationType,
        relData.notes,
        relData.confirmed,
        relData.createdBy
      );
    } else {
      relation = createRelation({
        ...relData,
        projectId
      });
    }
    
    return new Response(JSON.stringify(relation), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create relation' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { relationId, ...data } = body;
    if (!relationId) {
      return new Response(JSON.stringify({ error: 'Relation ID required' }), { status: 400 });
    }
    const updated = updateRelation(relationId, data);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Relation not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update relation' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { relationId } = body;
    if (!relationId) {
      return new Response(JSON.stringify({ error: 'Relation ID required' }), { status: 400 });
    }
    const success = deleteRelation(relationId);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Relation not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete relation' }), { status: 500 });
  }
};
