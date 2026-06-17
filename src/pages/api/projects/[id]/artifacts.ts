import type { APIRoute } from 'astro';
import { listArtifacts, createArtifact, updateArtifact, deleteArtifact, getArtifactsByUnit } from '../../../../lib/artifacts';

export const GET: APIRoute = async ({ params, url }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const unitId = url.searchParams.get('unitId');
    let artifacts;
    if (unitId) {
      artifacts = getArtifactsByUnit(unitId);
    } else {
      const result = listArtifacts(projectId, { page: 1, pageSize: 1000 });
      artifacts = result.items;
    }
    return new Response(JSON.stringify(artifacts), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch artifacts' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const body = await request.json();
    const artifact = createArtifact({
      ...body,
      projectId
    });
    return new Response(JSON.stringify(artifact), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create artifact' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { artifactId, ...data } = body;
    if (!artifactId) {
      return new Response(JSON.stringify({ error: 'Artifact ID required' }), { status: 400 });
    }
    const updated = updateArtifact(artifactId, data);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Artifact not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update artifact' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { artifactId } = body;
    if (!artifactId) {
      return new Response(JSON.stringify({ error: 'Artifact ID required' }), { status: 400 });
    }
    const success = deleteArtifact(artifactId);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Artifact not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete artifact' }), { status: 500 });
  }
};
