import { getDb, saveDb } from './db';
import { generateId, now } from './utils';
import type { Photo } from '../types';

export function createPhoto(data: Omit<Photo, 'id' | 'createdAt'>): Photo {
  const db = getDb();
  const id = generateId();
  const timestamp = now();
  
  const photo: Photo = {
    id,
    ...data,
    createdAt: timestamp
  };
  
  db.photos.push(photo);
  saveDb(db);
  
  return photo;
}

export function getPhotoById(id: string): Photo | null {
  const db = getDb();
  return db.photos.find(p => p.id === id) || null;
}

export function getPhotosByProject(projectId: string): Photo[] {
  const db = getDb();
  return db.photos
    .filter(p => p.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPhotosByUnit(unitId: string): Photo[] {
  const db = getDb();
  return db.photos
    .filter(p => p.unitId === unitId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPhotosByArtifact(artifactId: string): Photo[] {
  const db = getDb();
  return db.photos
    .filter(p => p.artifactId === artifactId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updatePhoto(id: string, data: Partial<Photo>): Photo | null {
  const db = getDb();
  const index = db.photos.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const existing = db.photos[index];
  const updated: Photo = {
    ...existing,
    ...data
  };
  
  db.photos[index] = updated;
  saveDb(db);
  
  return updated;
}

export function deletePhoto(id: string): boolean {
  const db = getDb();
  const index = db.photos.findIndex(p => p.id === id);
  
  if (index === -1) return false;
  
  db.photos.splice(index, 1);
  saveDb(db);
  
  return true;
}
