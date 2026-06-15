import React from 'react';
export function InfoPanel(props) {
    const master = props.master;
    const snapshots = props.snapshots;
    const onCreateSnapshot = props.onCreateSnapshot;
    const onRestoreSnapshot = props.onRestoreSnapshot;
    function formatDate(iso) {
        return new Date(iso).toLocaleString('zh-CN', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    }
    const statusLabels = {
        draft: '草稿', processing: '处理中', completed: '已完成', error: '异常',
    };
    const snapshotChildren = snapshots.length === 0
        ? React.createElement('p', { className: 'empty-text' }, '暂无快照')
        : React.createElement('div', { className: 'snapshot-list' }, snapshots.map(function (s) {
            return React.createElement('div', { key: s.id, className: 'snapshot-item' }, React.createElement('div', { className: 'snapshot-info' }, React.createElement('div', { className: 'snapshot-name' }, s.name), React.createElement('div', { className: 'snapshot-version' }, 'v' + s.version)), React.createElement('button', {
                className: 'btn-tiny',
                onClick: function () { onRestoreSnapshot(s.id); },
                title: '恢复到此版本',
            }, '回滚'));
        }));
    return React.createElement('div', { className: 'info-panel' }, React.createElement('div', { className: 'panel-section' }, React.createElement('h3', { className: 'panel-title' }, '基本信息'), React.createElement('div', { className: 'info-grid' }, React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '记录名称'), React.createElement('span', { className: 'info-value' }, master.name)), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '批次编号'), React.createElement('span', { className: 'info-value mono' }, master.batch)), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '当前版本'), React.createElement('span', { className: 'info-value version' }, 'v' + master.version)), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '地形类型'), React.createElement('span', { className: 'info-value' }, master.terrainType)), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '状态'), React.createElement('span', { className: 'status-badge status-' + master.status }, statusLabels[master.status] || master.status)))), React.createElement('div', { className: 'panel-section' }, React.createElement('h4', { className: 'panel-subtitle' }, '比例尺'), React.createElement('div', { className: 'info-grid' }, React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '比例'), React.createElement('span', { className: 'info-value mono' }, '1:' + master.scale)), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '单位'), React.createElement('span', { className: 'info-value' }, master.scaleUnit)), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '底图尺寸'), React.createElement('span', { className: 'info-value mono' }, master.mapWidth + ' \u00D7 ' + master.mapHeight)))), React.createElement('div', { className: 'panel-section' }, React.createElement('h4', { className: 'panel-subtitle' }, '描述'), React.createElement('p', { className: 'description' }, master.description)), React.createElement('div', { className: 'panel-section' }, React.createElement('h4', { className: 'panel-subtitle' }, '时间'), React.createElement('div', { className: 'info-grid' }, React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '创建时间'), React.createElement('span', { className: 'info-value' }, formatDate(master.createdAt))), React.createElement('div', { className: 'info-row' }, React.createElement('span', { className: 'info-label' }, '更新时间'), React.createElement('span', { className: 'info-value' }, formatDate(master.updatedAt))))), React.createElement('div', { className: 'panel-section' }, React.createElement('div', { className: 'section-header' }, React.createElement('h4', { className: 'panel-subtitle' }, '版本快照'), React.createElement('button', { className: 'btn-small', onClick: onCreateSnapshot }, '新建')), snapshotChildren));
}
