import type { APIRoute } from 'astro';
import { getPhotosByProject, createPhoto, updatePhoto, deletePhoto } from '../../../../lib/photos';

export const GET: APIRoute = async ({ params, url }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const photoType = url.searchParams.get('photoType');
    let photos = getPhotosByProject(projectId);
    if (photoType && photoType !== 'all') {
      photos = photos.filter(p => p.photoType === photoType);
    }
    return new Response(JSON.stringify(photos), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch photos' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const projectId = params.id;
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'Project ID required' }), { status: 400 });
  }
  try {
    const body = await request.json();
    const photo = createPhoto({
      ...body,
      projectId
    });
    return new Response(JSON.stringify(photo), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create photo' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { photoId, ...data } = body;
    if (!photoId) {
      return new Response(JSON.stringify({ error: 'Photo ID required' }), { status: 400 });
    }
    const updated = updatePhoto(photoId, data);
    if (!updated) {
      return new Response(JSON.stringify({ error: 'Photo not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to update photo' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { photoId } = body;
    if (!photoId) {
      return new Response(JSON.stringify({ error: 'Photo ID required' }), { status: 400 });
    }
    const success = deletePhoto(photoId);
    if (!success) {
      return new Response(JSON.stringify({ error: 'Photo not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to delete photo' }), { status: 500 });
  }
};
