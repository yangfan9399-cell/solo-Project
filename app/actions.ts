'use server';

import { revalidatePath } from 'next/cache';
import {
  updateLayerOffset,
  addControlPoint,
  removeControlPoint,
  addRepair,
  computeVersionStats,
  updateProject,
  listLayers,
  listControlPoints,
  getLayer,
} from '@/lib/db';
import type { ProjectStatus, AnomalyLevel, ControlPoint } from '@/lib/types';

export async function saveLayerOffset(formData: FormData) {
  const layerId = Number(formData.get('layer_id'));
  const ox = Number(formData.get('offset_x'));
  const oy = Number(formData.get('offset_y'));
  const rot = Number(formData.get('rotation'));
  const opacity = Number(formData.get('opacity'));
  const aligned = formData.get('is_aligned') === '1';
  if (!layerId) return { ok: false, error: 'missing layer_id' };
  updateLayerOffset(layerId, {
    offset_x: Number.isFinite(ox) ? Math.round(ox * 100) / 100 : undefined,
    offset_y: Number.isFinite(oy) ? Math.round(oy * 100) / 100 : undefined,
    rotation: Number.isFinite(rot) ? Math.round(rot * 100) / 100 : undefined,
    opacity: Number.isFinite(opacity) ? opacity : undefined,
    is_aligned: aligned,
  });
  const layer = getLayer(layerId);
  if (layer) {
    computeVersionStats(layer.project_id, layer.version_id);
    revalidatePath(`/project/${layer.project_id}`);
    revalidatePath('/');
  }
  return { ok: true };
}

export async function createControlPoint(
  data: Pick<ControlPoint, 'layer_id' | 'project_id' | 'version_id' | 'label' | 'ref_x' | 'ref_y' | 'cur_x' | 'cur_y'>
) {
  const id = await addControlPoint({
    layer_id: data.layer_id,
    project_id: data.project_id,
    version_id: data.version_id,
    label: data.label,
    ref_x: Math.round(data.ref_x * 100) / 100,
    ref_y: Math.round(data.ref_y * 100) / 100,
    cur_x: Math.round(data.cur_x * 100) / 100,
    cur_y: Math.round(data.cur_y * 100) / 100,
  });
  computeVersionStats(data.project_id, data.version_id);
  revalidatePath(`/project/${data.project_id}`);
  revalidatePath('/');
  return { ok: true, id };
}

export async function deleteControlPoint(pointId: number, projectId: number, versionId: number) {
  removeControlPoint(pointId);
  computeVersionStats(projectId, versionId);
  revalidatePath(`/project/${projectId}`);
  revalidatePath('/');
  return { ok: true };
}

export async function createRepair(formData: FormData) {
  const projectId = Number(formData.get('project_id'));
  const versionId = Number(formData.get('version_id'));
  const layerId = formData.get('layer_id') ? Number(formData.get('layer_id')) : null;
  const type = formData.get('action_type') as string;
  const desc = String(formData.get('description') || '');
  const op = String(formData.get('operator') || '匿名');
  const before = Number(formData.get('before_offset') || 0);
  const after = Number(formData.get('after_offset') || 0);
  if (!projectId || !versionId) return { ok: false, error: 'missing ids' };
  addRepair({
    project_id: projectId,
    version_id: versionId,
    layer_id: layerId,
    action_type: type as 'align' | 'retrim' | 'reprint' | 'note' | 'block_repair',
    description: desc,
    operator: op,
    before_offset: before,
    after_offset: after,
  });
  revalidatePath(`/project/${projectId}`);
  return { ok: true };
}

export async function recomputeStats(projectId: number, versionId: number) {
  computeVersionStats(projectId, versionId);
  revalidatePath(`/project/${projectId}`);
  revalidatePath('/');
  return { ok: true };
}

export async function patchProject(
  projectId: number,
  data: {
    name?: string;
    artist?: string;
    description?: string;
    status?: ProjectStatus;
    anomaly_level?: AnomalyLevel;
    anomaly_notes?: string | null;
  }
) {
  updateProject(projectId, data);
  revalidatePath(`/project/${projectId}`);
  revalidatePath('/');
  return { ok: true };
}

export async function bulkSyncLayerOffsets(projectId: number, versionId: number) {
  const layers = listLayers(versionId);
  for (const layer of layers) {
    const points = listControlPoints(layer.id);
    if (points.length === 0) continue;
    const avgDx = points.reduce((s, p) => s + p.delta_x, 0) / points.length;
    const avgDy = points.reduce((s, p) => s + p.delta_y, 0) / points.length;
    const allOk = points.every(p => p.distance <= 1.5);
    updateLayerOffset(layer.id, {
      offset_x: Math.round((layer.offset_x + avgDx) * 100) / 100,
      offset_y: Math.round((layer.offset_y + avgDy) * 100) / 100,
      is_aligned: allOk,
    });
  }
  computeVersionStats(projectId, versionId);
  revalidatePath(`/project/${projectId}`);
  revalidatePath('/');
  return { ok: true, count: layers.length };
}
