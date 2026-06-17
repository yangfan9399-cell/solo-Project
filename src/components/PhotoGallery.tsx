import { useState, useMemo } from 'react';
import type { Photo } from '../types';

interface PhotoGalleryProps {
  photos: Photo[];
  unitsMap: Record<string, { unitNumber: string }>;
}

const photoTypeLabels: Record<string, string> = {
  overview: '总览照',
  detail: '细节照',
  section: '剖面图',
  plan: '平面图',
  artifact: '器物照'
};

const photoTypeIcons: Record<string, string> = {
  overview: '🗺️',
  detail: '🔍',
  section: '📐',
  plan: '📏',
  artifact: '🏺'
};

export default function PhotoGallery({ photos, unitsMap }: PhotoGalleryProps) {
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const filtered = useMemo(() => {
    return photos.filter(p => {
      if (filterType && p.photoType !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (p.fileName || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.takenBy || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [photos, filterType, searchQuery]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: photos.length };
    photos.forEach(p => { counts[p.photoType] = (counts[p.photoType] || 0) + 1; });
    return counts;
  }, [photos]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="搜索文件名/描述/拍摄者..."
          style={{ flex: '1 1 200px' }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="select"
          style={{ minWidth: 160 }}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">全部类型 ({typeCounts.all || 0})</option>
          {Object.entries(photoTypeLabels).map(([k, label]) => (
            <option key={k} value={k}>{label} ({typeCounts[k] || 0})</option>
          ))}
        </select>
      </div>

      {filterType && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--color-text-muted)' }}>
          当前筛选: <strong>{photoTypeLabels[filterType]}</strong>
          {searchQuery && ` · 关键词 "${searchQuery}"`}
          {!searchQuery && ` · ${filtered.length} 张结果`}
          <button 
            style={{ 
              marginLeft: 8, 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary)',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: 13,
              padding: 0
            }}
            onClick={() => { setFilterType(''); setSearchQuery(''); }}
          >
            清除筛选
          </button>
        </div>
      )}

      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 14
        }}>
          {filtered.map(photo => (
            <div
              key={photo.id}
              className="photo-item"
              onClick={() => setSelectedPhoto(photo)}
              style={{ cursor: 'pointer', borderRadius: 8, overflow: 'hidden' }}
              title={`${photo.fileName} - ${photo.description || ''}`}
            >
              <div className="photo-placeholder" style={{ position: 'relative', height: 140 }}>
                <div style={{ fontSize: 44 }}>
                  {photoTypeIcons[photo.photoType] || '📷'}
                </div>
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 11
                }}>
                  <span className="badge badge-info" style={{ fontSize: 10 }}>
                    {photoTypeLabels[photo.photoType] || photo.photoType}
                  </span>
                </div>
              </div>
              <div className="photo-caption" style={{ padding: 8 }}>
                <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {photo.fileName}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {photo.takenDate || '未记录日期'}
                </div>
                {photo.unitId && unitsMap[photo.unitId] && (
                  <div style={{ fontSize: 10, color: 'var(--color-primary)', marginTop: 2 }}>
                    {unitsMap[photo.unitId].unitNumber}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-icon">📷</div>
          <div className="empty-title">{filterType || searchQuery ? '无匹配照片' : '暂无照片'}</div>
          <div className="empty-desc">{filterType || searchQuery ? '请尝试其他筛选条件' : '上传发掘现场和出土物照片'}</div>
        </div>
      )}

      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 12, maxWidth: 520, width: '100%',
            maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--color-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>照片详情</h3>
              <button style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }} onClick={() => setSelectedPhoto(null)}>×</button>
            </div>
            <div style={{
              background: 'var(--color-bg)',
              height: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12
            }}>
              <div style={{ fontSize: 80 }}>{photoTypeIcons[selectedPhoto.photoType] || '📷'}</div>
              <div>
                <span className="badge badge-info" style={{ fontSize: 12 }}>
                  {photoTypeLabels[selectedPhoto.photoType] || selectedPhoto.photoType}
                </span>
              </div>
            </div>
            <div style={{ padding: 18, overflow: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 12px', fontSize: 14 }}>
                <div style={{ color: 'var(--color-text-muted)' }}>文件名</div>
                <div style={{ fontWeight: 500, wordBreak: 'break-all' }}>{selectedPhoto.fileName}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>描述</div>
                <div>{selectedPhoto.description || '-'}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>拍摄日期</div>
                <div>{selectedPhoto.takenDate || '-'}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>拍摄者</div>
                <div>{selectedPhoto.takenBy || '-'}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>关联层位</div>
                <div>{selectedPhoto.unitId && unitsMap[selectedPhoto.unitId] ? unitsMap[selectedPhoto.unitId].unitNumber : '-'}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>关联出土物</div>
                <div>{selectedPhoto.artifactId || '-'}</div>
                <div style={{ color: 'var(--color-text-muted)' }}>备注</div>
                <div>{selectedPhoto.notes || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
