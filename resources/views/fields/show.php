<div class="card">
    <div class="card-header">
        <h1 class="card-title">地块详情</h1>
        <a href="/fields" class="btn btn-outline">返回列表</a>
    </div>
    
    <div class="grid grid-2">
        <div class="detail-row">
            <span class="detail-label">地块名称</span>
            <span class="detail-value"><strong><?php echo e($field['name']); ?></strong></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">位置</span>
            <span class="detail-value"><?php echo e($field['location']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">面积</span>
            <span class="detail-value"><?php echo formatArea($field['area']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">作物类型</span>
            <span class="detail-value"><?php echo e($field['crop_type']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">土壤类型</span>
            <span class="detail-value"><?php echo e($field['soil_type']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value"><?php echo statusBadge($field['status'], ['active' => '正常', 'inactive' => '停用']); ?></span>
        </div>
    </div>
    
    <?php if ($field['notes']): ?>
    <div class="detail-row">
        <span class="detail-label">备注</span>
        <span class="detail-value"><?php echo e($field['notes']); ?></span>
    </div>
    <?php endif; ?>
</div>

<div class="card">
    <div class="card-header">
        <h3 class="card-title">关联预约</h3>
    </div>
    <?php if (empty($bookings)): ?>
        <div class="empty-state">
            <p class="text-muted">暂无预约记录</p>
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
                    <td><?php echo e($booking['booking_no']); ?></td>
                    <td><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? $booking['operation_type']); ?></td>
                    <td><?php echo formatDate($booking['requested_date']); ?></td>
                    <td><?php echo statusBadge($booking['status'], Booking::statusLabels()); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
