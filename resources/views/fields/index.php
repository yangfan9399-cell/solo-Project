<div class="card">
    <div class="card-header">
        <h1 class="card-title">地块管理</h1>
        <a href="/fields/create" class="btn btn-primary">新增地块</a>
    </div>
    
    <?php if (empty($fields)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">🌾</div>
            <p>暂无地块信息</p>
            <a href="/fields/create" class="btn btn-primary mt-2">添加第一个地块</a>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>地块名称</th>
                    <th>位置</th>
                    <th>面积</th>
                    <th>作物类型</th>
                    <th>土壤类型</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($fields as $field): ?>
                <tr>
                    <td><strong><?php echo e($field['name']); ?></strong></td>
                    <td><?php echo e($field['location']); ?></td>
                    <td><?php echo formatArea($field['area']); ?></td>
                    <td><?php echo e($field['crop_type']); ?></td>
                    <td><?php echo e($field['soil_type']); ?></td>
                    <td><?php echo statusBadge($field['status'], ['active' => '正常', 'inactive' => '停用']); ?></td>
                    <td>
                        <a href="/fields/<?php echo $field['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
