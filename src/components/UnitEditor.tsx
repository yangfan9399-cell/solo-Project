import { useState } from 'react';
import type { StratigraphicUnit, StratigraphicRelation } from '../types';

interface UnitEditorProps {
  projectId: string;
  units: StratigraphicUnit[];
  relations: StratigraphicRelation[];
}

export default function UnitEditor({ projectId, units, relations }: UnitEditorProps) {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(units[0]?.id || null);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'relations' | 'artifacts'>('list');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUnits = units.filter(u => {
    if (filterType && u.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.unitNumber.toLowerCase().includes(q) || 
             u.designation?.toLowerCase().includes(q) ||
             u.description?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => a.depthTop - b.depthTop);

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const unitRelations = relations.filter(
    r => r.fromUnitId === selectedUnitId || r.toUnitId === selectedUnitId
  );

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        <div 
          className={`tab ${activeSubTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('list')}
        >
          层位列表
        </div>
        <div 
          className={`tab ${activeSubTab === 'relations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('relations')}
        >
          层位关系
        </div>
        <div 
          className={`tab ${activeSubTab === 'artifacts' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('artifacts')}
        >
          出土物
        </div>
      </div>

      {activeSubTab === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          <div>
            <div className="filter-bar" style={{ marginBottom: 12 }}>
              <input
                type="text"
                className="input"
                placeholder="搜索层位..."
                style={{ width: '100%' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-bar" style={{ marginBottom: 12 }}>
              <select 
                className="select" 
                style={{ width: '100%' }}
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="">全部类型</option>
                <option value="layer">地层</option>
                <option value="feature">遗迹</option>
                <option value="disturbance">扰动</option>
              </select>
            </div>
            <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              {filteredUnits.map(unit => (
                <div
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                    background: selectedUnitId === unit.id ? 'var(--color-bg)' : 'white',
                    borderLeft: selectedUnitId === unit.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`badge badge-${unit.type}`}>{unit.type === 'layer' ? '地层' : unit.type === 'feature' ? '遗迹' : '扰动'}</span>
                    <span style={{ fontWeight: 500 }}>{unit.unitNumber}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {unit.designation || '未命名'} · {unit.depthTop}-{unit.depthBottom}m
                  </div>
                </div>
              ))}
              {filteredUnits.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  无匹配层位
                </div>
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
                  <span className={`badge badge-${selectedUnit.type}`}>
                    {selectedUnit.type === 'layer' ? '地层' : selectedUnit.type === 'feature' ? '遗迹' : '扰动'}
                  </span>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">层位编号</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.unitNumber} readOnly />
                  </div>
                  <div className="form-group">
                    <label className="form-label">类型</label>
                    <select className="select" style={{ width: '100%' }} defaultValue={selectedUnit.type}>
                      <option value="layer">地层</option>
                      <option value="feature">遗迹</option>
                      <option value="disturbance">扰动</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">名称/定名</label>
                  <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.designation} />
                </div>

                <div className="form-group">
                  <label className="form-label">描述</label>
                  <textarea className="textarea" style={{ width: '100%', minHeight: 80 }} defaultValue={selectedUnit.description} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">顶部深度 (m)</label>
                    <input className="input" style={{ width: '100%' }} type="number" step="0.01" defaultValue={selectedUnit.depthTop} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">底部深度 (m)</label>
                    <input className="input" style={{ width: '100%' }} type="number" step="0.01" defaultValue={selectedUnit.depthBottom} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">厚度 (m)</label>
                    <input className="input" style={{ width: '100%' }} type="number" step="0.01" defaultValue={selectedUnit.thickness} readOnly />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">土色</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.color} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">质地</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.texture} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">包含物</label>
                  <textarea className="textarea" style={{ width: '100%' }} defaultValue={selectedUnit.includes} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">发掘者</label>
                    <input className="input" style={{ width: '100%' }} defaultValue={selectedUnit.excavatedBy} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">发掘日期</label>
                    <input className="input" style={{ width: '100%' }} type="date" defaultValue={selectedUnit.excavationDate} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">备注</label>
                  <textarea className="textarea" style={{ width: '100%' }} defaultValue={selectedUnit.notes} />
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-danger">删除</button>
                  <button className="btn btn-primary">保存修改</button>
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
            <h4 style={{ margin: 0 }}>层位关系列表</h4>
            <button className="btn btn-primary btn-sm">+ 添加关系</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>单元A</th>
                <th>关系</th>
                <th>单元B</th>
                <th>状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {unitRelations.map(rel => {
                const fromUnit = units.find(u => u.id === rel.fromUnitId);
                const toUnit = units.find(u => u.id === rel.toUnitId);
                const relationLabels: Record<string, string> = {
                  'above': '在...之上',
                  'below': '在...之下',
                  'equal': '同期',
                  'cut': '打破',
                  'fills': '被...填充',
                  'contemporary': '同时期'
                };
                return (
                  <tr key={rel.id}>
                    <td>{fromUnit?.unitNumber || '-'}</td>
                    <td>
                      <span className={`badge ${rel.confirmed ? 'badge-info' : 'badge-warning'}`}>
                        {relationLabels[rel.relationType] || rel.relationType}
                      </span>
                    </td>
                    <td>{toUnit?.unitNumber || '-'}</td>
                    <td>
                      <span className={`badge ${rel.confirmed ? 'badge-active' : 'badge-warning'}`}>
                        {rel.confirmed ? '已确认' : '待确认'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {rel.notes || '-'}
                    </td>
                    <td>
                      <button className="btn btn-sm">编辑</button>
                    </td>
                  </tr>
                );
              })}
              {unitRelations.length === 0 && selectedUnit && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state" style={{ padding: '32px' }}>
                      <div className="empty-icon">🔗</div>
                      <div className="empty-title">暂无层位关系</div>
                      <div className="empty-desc">
                        {selectedUnit.unitNumber} 尚未与其他层位建立关系
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'artifacts' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>出土物列表</h4>
            <button className="btn btn-primary btn-sm">+ 添加出土物</button>
          </div>
          <div className="empty-state">
            <div className="empty-icon">🏺</div>
            <div className="empty-title">功能开发中</div>
            <div className="empty-desc">出土物管理功能将在后续版本完善</div>
          </div>
        </div>
      )}
    </div>
  );
}
