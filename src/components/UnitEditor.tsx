import { useState, useEffect, useCallback } from 'react';
import type { StratigraphicUnit, StratigraphicRelation, Artifact } from '../types';

interface UnitEditorProps {
  projectId: string;
  units: StratigraphicUnit[];
  relations: StratigraphicRelation[];
}

const relationLabels: Record<string, string> = {
  'above': '在...之上',
  'below': '在...之下',
  'equal': '同期',
  'cut': '打破',
  'fills': '填充',
  'contemporary': '同时期'
};

const unitTypeLabels: Record<string, string> = {
  'layer': '地层',
  'feature': '遗迹',
  'disturbance': '扰动'
};

const artifactTypeOptions = ['陶器', '瓷器', '铜器', '铁器', '玉器', '石器', '骨器', '甲骨', '钱币', '建筑构件', '其他'];

export default function UnitEditor({ projectId, units: initialUnits, relations: initialRelations }: UnitEditorProps) {
  const [units, setUnits] = useState<StratigraphicUnit[]>(initialUnits);
  const [relations, setRelations] = useState<StratigraphicRelation[]>(initialRelations);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(units[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'relations' | 'artifacts'>('list');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [showArtifactModal, setShowArtifactModal] = useState(false);
  const [formData, setFormData] = useState<Partial<StratigraphicUnit>>({});
  const [relationForm, setRelationForm] = useState({ fromUnitId: '', relationType: 'above', toUnitId: '', notes: '', confirmed: true });
  const [artifactForm, setArtifactForm] = useState<Partial<Artifact>>({});

  const loadArtifacts = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts`);
      if (res.ok) {
        setArtifacts(await res.json());
      }
    } catch {}
  }, [projectId]);

  useEffect(() => {
    loadArtifacts();
  }, [loadArtifacts]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredUnits = units.filter(u => {
    if (filterType && u.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.unitNumber.toLowerCase().includes(q) || 
             (u.designation?.toLowerCase() || '').includes(q) ||
             (u.description?.toLowerCase() || '').includes(q);
    }
    return true;
  }).sort((a, b) => a.depthTop - b.depthTop);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const unitRelations = relations.filter(
    r => r.fromUnitId === selectedUnitId || r.toUnitId === selectedUnitId
  );

  const unitArtifacts = artifacts.filter(a => a.unitId === selectedUnitId);

  const refreshAll = async () => {
    try {
      const [uRes, rRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/units`),
        fetch(`/api/projects/${projectId}/relations`)
      ]);
      if (uRes.ok) setUnits(await uRes.json());
      if (rRes.ok) setRelations(await rRes.json());
      await loadArtifacts();
    } catch {}
  };

  const openNewUnitModal = () => {
    setFormData({
      projectId,
      unitNumber: `第${units.length + 1}层`,
      type: 'layer',
      designation: '',
      description: '',
      depthTop: 0,
      depthBottom: 0,
      thickness: 0,
      color: '',
      texture: '',
      includes: '',
      notes: '',
      excavatedBy: '',
      excavationDate: new Date().toISOString().slice(0, 10)
    });
    setShowUnitModal(true);
  };

  const openEditUnitModal = () => {
    if (!selectedUnit) return;
    setFormData({ ...selectedUnit });
    setShowUnitModal(true);
  };

  const saveUnit = async () => {
    if (!formData.unitNumber || !formData.type) {
      setToast({ type: 'error', message: '请填写层位编号和类型' });
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!formData.id;
      const res = isEditing
        ? await fetch(`/api/projects/${projectId}/units`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId: formData.id, ...formData })
          })
        : await fetch(`/api/projects/${projectId}/units`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
      if (res.ok) {
        const saved = await res.json();
        setToast({ type: 'success', message: isEditing ? '层位已更新' : '层位已创建' });
        setShowUnitModal(false);
        await refreshAll();
        if (saved.id) setSelectedUnitId(saved.id);
      } else {
        setToast({ type: 'error', message: '保存失败' });
      }
    } catch {
      setToast({ type: 'error', message: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const deleteUnit = async () => {
    if (!selectedUnit) return;
    if (!confirm(`确定删除「${selectedUnit.unitNumber} ${selectedUnit.designation || ''}」？相关的关系、出土物也将被清除`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/units`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: selectedUnit.id })
      });
      if (res.ok) {
        setToast({ type: 'success', message: '层位已删除' });
        await refreshAll();
        setSelectedUnitId(units[0]?.id || null);
      } else {
        setToast({ type: 'error', message: '删除失败' });
      }
    } catch {
      setToast({ type: 'error', message: '删除失败' });
    } finally {
      setSaving(false);
    }
  };

  const openNewRelationModal = () => {
    setRelationForm({
      fromUnitId: selectedUnitId || '',
      relationType: 'above',
      toUnitId: '',
      notes: '',
      confirmed: true
    });
    setShowRelationModal(true);
  };

  const saveRelation = async () => {
    if (!relationForm.fromUnitId || !relationForm.toUnitId || !relationForm.relationType) {
      setToast({ type: 'error', message: '请选择两个层位和关系类型' });
      return;
    }
    if (relationForm.fromUnitId === relationForm.toUnitId) {
      setToast({ type: 'error', message: '不能与自身建立关系' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/relations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationForm)
      });
      if (res.ok) {
        setToast({ type: 'success', message: '关系已创建' });
        setShowRelationModal(false);
        await refreshAll();
      } else {
        setToast({ type: 'error', message: '创建失败' });
      }
    } catch {
      setToast({ type: 'error', message: '创建失败' });
    } finally {
      setSaving(false);
    }
  };

  const deleteRelation = async (id: string) => {
    if (!confirm('确定删除该层位关系？')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/relations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationId: id })
      });
      if (res.ok) {
        setToast({ type: 'success', message: '关系已删除' });
        await refreshAll();
      }
    } catch {
      setToast({ type: 'error', message: '删除失败' });
    }
  };

  const openNewArtifactModal = () => {
    setArtifactForm({
      projectId,
      unitId: selectedUnitId || '',
      catalogNumber: `CW-${Date.now().toString().slice(-6)}`,
      name: '',
      type: '陶器',
      description: '',
      quantity: 1,
      condition: '完整',
      notes: '',
      recordedBy: '',
      recordedDate: new Date().toISOString().slice(0, 10)
    });
    setShowArtifactModal(true);
  };

  const saveArtifact = async () => {
    if (!artifactForm.catalogNumber || !artifactForm.type) {
      setToast({ type: 'error', message: '请填写编目号和类型' });
      return;
    }
    setSaving(true);
    try {
      const isEditing = !!artifactForm.id;
      const res = isEditing
        ? await fetch(`/api/projects/${projectId}/artifacts`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ artifactId: artifactForm.id, ...artifactForm })
          })
        : await fetch(`/api/projects/${projectId}/artifacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(artifactForm)
          });
      if (res.ok) {
        setToast({ type: 'success', message: isEditing ? '出土物已更新' : '出土物已创建' });
        setShowArtifactModal(false);
        await refreshAll();
      } else {
        setToast({ type: 'error', message: '保存失败' });
      }
    } catch {
      setToast({ type: 'error', message: '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  const deleteArtifact = async (id: string) => {
    if (!confirm('确定删除该出土物记录？')) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/artifacts`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId: id })
      });
      if (res.ok) {
        setToast({ type: 'success', message: '出土物已删除' });
        await refreshAll();
      }
    } catch {
      setToast({ type: 'error', message: '删除失败' });
    }
  };

  const calcThickness = () => {
    const top = parseFloat(String(formData.depthTop || 0));
    const bottom = parseFloat(String(formData.depthBottom || 0));
    if (!isNaN(top) && !isNaN(bottom) && bottom >= top) {
    setFormData((d: Partial<StratigraphicUnit>) => ({ ...d, thickness: +(bottom - top).toFixed(3) }));
    }
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 8, fontWeight: 500,
          background: toast.type === 'success' ? 'var(--color-success)' : toast.type === 'error' ? 'var(--color-danger)' : 'var(--color-info)',
          color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {toast.message}
        </div>
      )}

      <div className="tabs" style={{ marginBottom: 16 }}>
        <div className={`tab ${activeSubTab === 'list' ? 'active' : ''}`} onClick={() => setActiveSubTab('list')}>层位列表</div>
        <div className={`tab ${activeSubTab === 'relations' ? 'active' : ''}`} onClick={() => setActiveSubTab('relations')}>层位关系</div>
        <div className={`tab ${activeSubTab === 'artifacts' ? 'active' : ''}`} onClick={() => setActiveSubTab('artifacts')}>出土物</div>
      </div>

      {activeSubTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
          <div>
            <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={openNewUnitModal}>+ 新建层位</button>
            </div>
            <div className="filter-bar" style={{ marginBottom: 12 }}>
              <input type="text" className="input" placeholder="搜索层位..." style={{ width: '100%' }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="filter-bar" style={{ marginBottom: 12 }}>
              <select className="select" style={{ width: '100%' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">全部类型</option>
                <option value="layer">地层</option>
                <option value="feature">遗迹</option>
                <option value="disturbance">扰动</option>
              </select>
            </div>
            <div style={{ maxHeight: 600, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              {filteredUnits.map(unit => (
                <div key={unit.id} onClick={() => setSelectedUnitId(unit.id)} style={{
                  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
                  background: selectedUnitId === unit.id ? 'var(--color-bg)' : 'white',
                  borderLeft: selectedUnitId === unit.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${unit.type}`}>{unitTypeLabels[unit.type] || unit.type}</span>
                    <span style={{ fontWeight: 500 }}>{unit.unitNumber}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {unit.designation || '未命名'} · {unit.depthTop}-{unit.depthBottom}m
                  </div>
                </div>
              ))}
              {filteredUnits.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>无匹配层位</div>
              )}
            </div>
          </div>

          <div>
            {selectedUnit ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: 18 }}>
                    {selectedUnit.unitNumber} - {selectedUnit.designation || '未命名'}
                  </h3>
                  <span className={`badge badge-${selectedUnit.type}`}>{unitTypeLabels[selectedUnit.type] || selectedUnit.type}</span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">层位编号</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.unitNumber} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <select className="select" style={{ width: '100%' }} defaultValue={selectedUnit.type} disabled>
                      <option value="layer">地层</option>
                      <option value="feature">遗迹</option>
                      <option value="disturbance">扰动</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">名称/定名</label>
                  <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.designation} readOnly />
                </div>

                <div className="form-group">
                  <label className="form-label">描述</label>
                  <textarea className="textarea" style={{ width: '100%', minHeight: 80 }} defaultValue={selectedUnit.description} readOnly />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">顶部深度 (m)</label>
                    <input className="input" style={{ width: '100%' }} type="number" step="0.01" defaultValue={selectedUnit.depthTop} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">底部深度 (m)</label>
                    <input className="input" style={{ width: '100%' }} type="number" step="0.01" defaultValue={selectedUnit.depthBottom} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">厚度 (m)</label>
                    <input className="input" style={{ width: '100%' }} type="number" step="0.01" defaultValue={selectedUnit.thickness} readOnly />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">土色</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.color} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">质地</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.texture} readOnly />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">包含物</label>
                  <textarea className="textarea" style={{ width: '100%' }} defaultValue={selectedUnit.includes} readOnly />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">发掘者</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.excavatedBy} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">发掘日期</label>
                    <input className="input" style={{ width: '100%' }} type="date" defaultValue={selectedUnit.excavationDate} readOnly />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea className="textarea" style={{ width: '100%' }} defaultValue={selectedUnit.notes} readOnly />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn btn-danger" onClick={deleteUnit} disabled={saving}>删除</button>
                  <button className="btn btn-primary" onClick={openEditUnitModal} disabled={saving}>保存修改</button>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <div className="empty-title">请选择层位</div>
                <div className="empty-desc">从左侧列表选择一个层位单元查看详情</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'relations' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>层位关系列表 {selectedUnit && <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-text-muted)' }}>当前筛选: {selectedUnit.unitNumber}</span>}</h4>
            <button className="btn btn-primary btn-sm" onClick={openNewRelationModal}>+ 添加关系</button>
          </div>
          <table className="table">
            <thead>
              <tr><th>单元A</th><th>关系</th><th>单元B</th><th>状态</th><th>备注</th><th>操作</th></tr>
            </thead>
            <tbody>
              {unitRelations.map(rel => {
                const fromUnit = units.find(u => u.id === rel.fromUnitId);
                const toUnit = units.find(u => u.id === rel.toUnitId);
                return (
                  <tr key={rel.id}>
                    <td>{fromUnit?.unitNumber || '-'}</td>
                    <td><span className={`badge ${rel.confirmed ? 'badge-info' : 'badge-warning'}`}>{relationLabels[rel.relationType] || rel.relationType}</span></td>
                    <td>{toUnit?.unitNumber || '-'}</td>
                    <td><span className={`badge ${rel.confirmed ? 'badge-active' : 'badge-warning'}`}>{rel.confirmed ? '已确认' : '待确认'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{rel.notes || '-'}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => deleteRelation(rel.id)}>删除</button></td>
                  </tr>
                );
              })}
              {unitRelations.length === 0 && selectedUnit && (
                <tr><td colSpan={6}><div className="empty-state" style={{ padding: '32px' }}>
                  <div className="empty-icon">🔗</div>
                  <div className="empty-title">暂无层位关系</div>
                  <div className="empty-desc">{selectedUnit.unitNumber} 尚未与其他层位建立关系</div>
                </div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'artifacts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>出土物列表 {selectedUnit && <span style={{ fontWeight: 400, fontSize: 13, color: 'var(--color-text-muted)' }}>当前筛选: {selectedUnit.unitNumber}</span>}</h4>
            <button className="btn btn-primary btn-sm" onClick={openNewArtifactModal}>+ 添加出土物</button>
          </div>
          {unitArtifacts.length > 0 ? (
            <table className="table">
              <thead><tr><th>编目号</th><th>名称</th><th>类型</th><th>数量</th><th>状况</th><th>记录日期</th><th>操作</th></tr></thead>
              <tbody>
                {unitArtifacts.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'monospace' }}>{a.catalogNumber}</td>
                    <td>{a.name || '-'}</td>
                    <td><span className="badge badge-info">{a.type}</span></td>
                    <td>{a.quantity}</td>
                    <td>{a.condition || '-'}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{a.recordedDate || '-'}</td>
                    <td><button className="btn btn-sm btn-danger" onClick={() => deleteArtifact(a.id)}>删除</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state" style={{ padding: '40px' }}>
              <div className="empty-icon">🏺</div>
              <div className="empty-title">暂无出土物记录</div>
              <div className="empty-desc">{selectedUnit ? selectedUnit.unitNumber : '当前项目'} 尚未记录出土物，点击右上角添加</div>
            </div>
          )}
        </div>
      )}

      {showUnitModal && (
        <div style={modalStyle} onClick={() => setShowUnitModal(false)}>
          <div style={modalContentStyle(720)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>{formData.id ? '编辑层位' : '新建层位'}</div>
            <div style={{ padding: 20, maxHeight: '70vh', overflow: 'auto' }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">层位编号 *</label>
                  <input className="input" style={{ width: '100%' }} value={formData.unitNumber || ''} onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">类型 *</label>
                  <select className="select" style={{ width: '100%' }} value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value as any })}>
                    <option value="">请选择</option>
                    <option value="layer">地层</option>
                    <option value="feature">遗迹</option>
                    <option value="disturbance">扰动</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">名称/定名</label>
                <input className="input" style={{ width: '100%' }} value={formData.designation || ''} onChange={e => setFormData({ ...formData, designation: e.target.value })} />
              </div>
              <div className="form-group"><label className="form-label">描述</label>
                <textarea className="textarea" style={{ width: '100%', minHeight: 60 }} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">顶部深度 (m)</label>
                  <input className="input" style={{ width: '100%' }} type="number" step="0.01" value={formData.depthTop ?? ''} onChange={e => { setFormData({ ...formData, depthTop: parseFloat(e.target.value) || 0 }); calcThickness(); }} />
                </div>
                <div className="form-group"><label className="form-label">底部深度 (m)</label>
                  <input className="input" style={{ width: '100%' }} type="number" step="0.01" value={formData.depthBottom ?? ''} onChange={e => { setFormData({ ...formData, depthBottom: parseFloat(e.target.value) || 0 }); calcThickness(); }} />
                </div>
                <div className="form-group"><label className="form-label">厚度 (m)</label>
                  <input className="input" style={{ width: '100%' }} type="number" step="0.01" value={formData.thickness ?? ''} readOnly />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">土色</label>
                  <input className="input" style={{ width: '100%' }} value={formData.color || ''} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                </div>
                <div className="form-group"><label className="form-label">质地</label>
                  <input className="input" style={{ width: '100%' }} value={formData.texture || ''} onChange={e => setFormData({ ...formData, texture: e.target.value })} />
                </div>
              </div>
              <div className="form-group"><label className="form-label">包含物</label>
                <textarea className="textarea" style={{ width: '100%' }} value={formData.includes || ''} onChange={e => setFormData({ ...formData, includes: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">发掘者</label>
                  <input className="input" style={{ width: '100%' }} value={formData.excavatedBy || ''} onChange={e => setFormData({ ...formData, excavatedBy: e.target.value })} />
                </div>
                <div className="form-group"><label className="form-label">发掘日期</label>
                  <input className="input" style={{ width: '100%' }} type="date" value={formData.excavationDate || ''} onChange={e => setFormData({ ...formData, excavationDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group"><label className="form-label">备注</label>
                <textarea className="textarea" style={{ width: '100%' }} value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button className="btn" onClick={() => setShowUnitModal(false)} disabled={saving}>取消</button>
              <button className="btn btn-primary" onClick={saveUnit} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}

      {showRelationModal && (
        <div style={modalStyle} onClick={() => setShowRelationModal(false)}>
          <div style={modalContentStyle(560)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>添加层位关系</div>
            <div style={{ padding: 20 }}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">单元A *</label>
                  <select className="select" style={{ width: '100%' }} value={relationForm.fromUnitId} onChange={e => setRelationForm({ ...relationForm, fromUnitId: e.target.value })}>
                    <option value="">请选择</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber} ({u.designation || '未命名'})</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">关系类型 *</label>
                  <select className="select" style={{ width: '100%' }} value={relationForm.relationType} onChange={e => setRelationForm({ ...relationForm, relationType: e.target.value })}>
                    {Object.entries(relationLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">单元B *</label>
                <select className="select" style={{ width: '100%' }} value={relationForm.toUnitId} onChange={e => setRelationForm({ ...relationForm, toUnitId: e.target.value })}>
                  <option value="">请选择</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber} ({u.designation || '未命名'})</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">备注</label>
                <textarea className="textarea" style={{ width: '100%' }} value={relationForm.notes} onChange={e => setRelationForm({ ...relationForm, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="rel-conf" checked={relationForm.confirmed} onChange={e => setRelationForm({ ...relationForm, confirmed: e.target.checked })} />
                <label htmlFor="rel-conf" style={{ fontSize: 14 }}>确认此关系（已验证）</label>
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button className="btn" onClick={() => setShowRelationModal(false)} disabled={saving}>取消</button>
              <button className="btn btn-primary" onClick={saveRelation} disabled={saving}>{saving ? '保存中...' : '创建关系'}</button>
            </div>
          </div>
        </div>
      )}

      {showArtifactModal && (
        <div style={modalStyle} onClick={() => setShowArtifactModal(false)}>
          <div style={modalContentStyle(560)} onClick={e => e.stopPropagation()}>
            <div style={modalHeaderStyle}>添加出土物</div>
            <div style={{ padding: 20 }}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">编目号 *</label>
                  <input className="input" style={{ width: '100%' }} value={artifactForm.catalogNumber || ''} onChange={e => setArtifactForm({ ...artifactForm, catalogNumber: e.target.value })} />
                </div>
                <div className="form-group"><label className="form-label">类型 *</label>
                  <select className="select" style={{ width: '100%' }} value={artifactForm.type || ''} onChange={e => setArtifactForm({ ...artifactForm, type: e.target.value })}>
                    {artifactTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">名称</label>
                  <input className="input" style={{ width: '100%' }} value={artifactForm.name || ''} onChange={e => setArtifactForm({ ...artifactForm, name: e.target.value })} />
                </div>
                <div className="form-group"><label className="form-label">所属层位</label>
                  <select className="select" style={{ width: '100%' }} value={artifactForm.unitId || ''} onChange={e => setArtifactForm({ ...artifactForm, unitId: e.target.value })}>
                    <option value="">(未指定)</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.unitNumber}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group"><label className="form-label">描述</label>
                <textarea className="textarea" style={{ width: '100%', minHeight: 60 }} value={artifactForm.description || ''} onChange={e => setArtifactForm({ ...artifactForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">数量</label>
                  <input className="input" style={{ width: '100%' }} type="number" min={1} value={artifactForm.quantity || 1} onChange={e => setArtifactForm({ ...artifactForm, quantity: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="form-group"><label className="form-label">保存状况</label>
                  <select className="select" style={{ width: '100%' }} value={artifactForm.condition || ''} onChange={e => setArtifactForm({ ...artifactForm, condition: e.target.value })}>
                    <option value="完整">完整</option>
                    <option value="可复原">可复原</option>
                    <option value="残损">残损</option>
                    <option value="标本">标本</option>
                    <option value="碎块">碎块</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">记录人</label>
                  <input className="input" style={{ width: '100%' }} value={artifactForm.recordedBy || ''} onChange={e => setArtifactForm({ ...artifactForm, recordedBy: e.target.value })} />
                </div>
                <div className="form-group"><label className="form-label">记录日期</label>
                  <input className="input" style={{ width: '100%' }} type="date" value={artifactForm.recordedDate || ''} onChange={e => setArtifactForm({ ...artifactForm, recordedDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group"><label className="form-label">备注</label>
                <textarea className="textarea" style={{ width: '100%' }} value={artifactForm.notes || ''} onChange={e => setArtifactForm({ ...artifactForm, notes: e.target.value })} />
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button className="btn" onClick={() => setShowArtifactModal(false)} disabled={saving}>取消</button>
              <button className="btn btn-primary" onClick={saveArtifact} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const modalStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
  alignItems: 'center', justifyContent: 'center'
};
const modalContentStyle = (w: number): React.CSSProperties => ({
  background: 'white', borderRadius: 12, width: '100%', maxWidth: w,
  maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
});
const modalHeaderStyle: React.CSSProperties = {
  padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
  fontWeight: 600, fontSize: 16
};
const modalFooterStyle: React.CSSProperties = {
  padding: '12px 20px', borderTop: '1px solid var(--color-border)',
  display: 'flex', justifyContent: 'flex-end', gap: 8
};
