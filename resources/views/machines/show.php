<div class="card">
    <div class="card-header">
        <h1 class="card-title">农机详情</h1>
        <a href="/machines" class="btn btn-outline">返回列表</a>
    </div>
    
    <div class="grid grid-2">
        <div class="detail-row">
            <span class="detail-label">农机名称</span>
            <span class="detail-value"><strong><?php echo e($machine['name']); ?></strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">类型</span>
            <span class="detail-value"><?php echo e(Machine::types()[$machine['type']] ?? $machine['type']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">型号</span>
            <span class="detail-value"><?php echo e($machine['model']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">车牌号</span>
            <span class="detail-value"><?php echo e($machine['plate_number']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">油耗</span>
            <span class="detail-value"><?php echo e($machine['fuel_consumption']); ?> 升/小时</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value"><?php echo statusBadge($machine['status'], ['available' => '可用', 'busy' => '作业中', 'maintenance' => '维修中']); ?></span>
        </div>
    </div>
    
    <?php if ($machine['notes']): ?>
    <div class="detail-row">
        <span class="detail-label">备注</span>
        <span class="detail-value"><?php echo e($machine['notes']); ?></span>
    </div>
    <?php endif; ?>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">排班记录</h3>
    </div>
    <?php if (empty($schedules)): ?>
        <div class="empty-state">
            <p class="text-muted">暂无排班记录</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>排班日期</th>
                    <th>时间</th>
                    <th>状态</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($schedules as $schedule): ?>
                <tr>
                    <td><?php echo formatDate($schedule['scheduled_date']); ?></td>
                    <td><?php echo e($schedule['start_time']); ?> - <?php echo e($schedule['end_time']); ?></td>
                    <td><?php echo statusBadge($schedule['status'], Schedule::statusLabels()); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
