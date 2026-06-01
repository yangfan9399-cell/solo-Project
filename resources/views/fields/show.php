<div class="card">
    <div class="card-header">
        <h1 class="card-title">地块详情</h1>
        <a href="/fields" class="btn btn-outline">返回列表</a>
    </div>
    
    <?php if (!$field): ?>
        <div class="alert alert-error">
            <p><strong>错误：</strong>地块信息不存在或已被删除。</p>
            <a href="/fields" class="btn btn-sm btn-outline mt-1">返回地块列表</a>
        </div>
    <?php else: ?>
    
    <div class="grid grid-2">
        <div class="detail-row">
            <span class="detail-label">地块名称</span>
            <span class="detail-value"><strong><?php echo e($field['name'] ?? '-'); ?></strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">位置</span>
            <span class="detail-value"><?php echo e($field['location'] ?? '-'); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">面积</span>
            <span class="detail-value"><?php echo formatArea($field['area'] ?? 0); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">作物类型</span>
            <span class="detail-value"><?php echo e($field['crop_type'] ?? '-'); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">土壤类型</span>
            <span class="detail-value"><?php echo e($field['soil_type'] ?? '-'); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value"><?php echo statusBadge($field['status'] ?? 'unknown', ['active' => '正常', 'inactive' => '停用']); ?></span>
        </div>
    </div>
    
    <?php if (!empty($field['notes'])): ?>
    <div class="detail-row">
        <span class="detail-label">备注</span>
        <span class="detail-value"><?php echo e($field['notes']); ?></span>
    </div>
    <?php endif; ?>
    
    <?php endif; ?>
</div>

<?php if ($field): ?>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">关联预约</h3>
    </div>
    <?php if (!is_array($bookings) || empty($bookings)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p class="text-muted">该地块暂无预约记录</p>
            <a href="/bookings/create" class="btn btn-sm btn-primary mt-1">创建预约</a>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>预约号</th>
                    <th>作业类型</th>
                    <th>预约日期</th>
                    <th>状态</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($bookings as $booking): ?>
                <tr>
                    <td><?php echo e($booking['booking_no'] ?? '-'); ?></td>
                    <td><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? ($booking['operation_type'] ?? '-')); ?></td>
                    <td><?php echo formatDate($booking['requested_date'] ?? null); ?></td>
                    <td><?php echo statusBadge($booking['status'] ?? 'unknown', Booking::statusLabels()); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<?php endif; ?>
