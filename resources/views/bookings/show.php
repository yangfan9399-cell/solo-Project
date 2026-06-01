<div class="card">
    <div class="card-header">
        <h1 class="card-title">预约详情</h1>
        <div class="flex gap-1">
            <a href="/bookings" class="btn btn-outline">返回列表</a>
        </div>
    </div>
    
    <div class="grid grid-2">
        <div>
            <div class="detail-row">
                <span class="detail-label">预约编号</span>
                <span class="detail-value"><strong><?php echo e($booking['booking_no']); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业类型</span>
                <span class="detail-value"><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? $booking['operation_type']); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">预约日期</span>
                <span class="detail-value"><?php echo formatDate($booking['requested_date']); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业面积</span>
                <span class="detail-value"><?php echo formatArea($booking['area']); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">优先级</span>
                <span class="detail-value"><?php echo e(Booking::priorities()[$booking['priority']] ?? $booking['priority']); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">当前状态</span>
                <span class="detail-value"><?php echo statusBadge($booking['status'], Booking::statusLabels()); ?></span>
            </div>
        </div>
        <div>
            <div class="detail-row">
                <span class="detail-label">地块名称</span>
                <span class="detail-value"><?php echo e($field['name']); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">地块位置</span>
                <span class="detail-value"><?php echo e($field['location']); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">地块面积</span>
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
        </div>
    </div>
    
    <?php if ($booking['notes']): ?>
    <div class="detail-row">
        <span class="detail-label">备注说明</span>
        <span class="detail-value"><?php echo e($booking['notes']); ?></span>
    </div>
    <?php endif; ?>
</div>

<?php if ($schedule): ?>
<div class="card">
    <div class="card-header">
        <h3 class="card-title">排班信息</h3>
    </div>
    <div class="grid grid-3">
        <div class="detail-row">
            <span class="detail-label">排班日期</span>
            <span class="detail-value"><?php echo formatDate($schedule['scheduled_date']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">作业时间</span>
            <span class="detail-value"><?php echo e($schedule['start_time']); ?> - <?php echo e($schedule['end_time']); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">排班状态</span>
            <span class="detail-value"><?php echo statusBadge($schedule['status'], Schedule::statusLabels()); ?></span>
        </div>
    </div>
</div>
<?php endif; ?>

<div class="card">
    <h3 class="card-title mb-1">状态流转</h3>
    <div class="timeline">
        <div class="timeline-item">
            <strong>预约提交</strong>
            <div class="text-sm text-muted"><?php echo formatDateTime($booking['created_at']); ?></div>
        </div>
        <?php if ($booking['status'] != 'pending'): ?>
        <div class="timeline-item">
            <strong><?php echo $booking['status'] == 'cancelled' ? '预约取消' : '预约确认'; ?></strong>
        </div>
        <?php endif; ?>
        <?php if ($schedule): ?>
        <div class="timeline-item">
            <strong>已排班</strong>
        </div>
        <?php endif; ?>
        <?php if ($booking['status'] == 'completed'): ?>
        <div class="timeline-item">
            <strong>作业完成</strong>
        </div>
        <?php endif; ?>
    </div>
</div>
