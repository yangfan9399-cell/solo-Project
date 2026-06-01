<div class="card">
    <div class="card-header">
        <h1 class="card-title">农机管理</h1>
    </div>
    
    <?php if (empty($machines)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">🚜</div>
            <p>暂无农机信息</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>农机名称</th>
                    <th>类型</th>
                    <th>型号</th>
                    <th>车牌号</th>
                    <th>油耗(L/小时)</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($machines as $machine): ?>
                <tr>
                    <td><strong><?php echo e($machine['name']); ?></strong></td>
                    <td><?php echo e(Machine::types()[$machine['type']] ?? $machine['type']); ?></td>
                    <td><?php echo e($machine['model']); ?></td>
                    <td><?php echo e($machine['plate_number']); ?></td>
                    <td><?php echo e($machine['fuel_consumption']); ?></td>
                    <td><?php echo statusBadge($machine['status'], ['available' => '可用', 'busy' => '作业中', 'maintenance' => '维修中']); ?></td>
                    <td>
                        <a href="/machines/<?php echo $machine['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
