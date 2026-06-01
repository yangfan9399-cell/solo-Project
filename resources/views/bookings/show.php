<div class="card">
    <div class="card-header">
        <h1 class="card-title">预约详情</h1>
        <div class="flex gap-1">
            <a href="/bookings" class="btn btn-outline">返回列表</a>
        </div>
    </div>
    
    <?php if (!$booking): ?>
        <div class="alert alert-error">
            <p><strong>错误：</strong>预约信息不存在或已被删除。</p>
            <a href="/bookings" class="btn btn-sm btn-outline mt-1">返回预约列表</a>
        </div>
    <?php else: ?>
    
    <div class="grid grid-2">
        <div>
            <div class="detail-row">
                <span class="detail-label">预约编号</span>
                <span class="detail-value"><strong><?php echo e($booking['booking_no'] ?? '-'); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业类型</span>
                <span class="detail-value"><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? ($booking['operation_type'] ?? '-')); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">预约日期</span>
                <span class="detail-value"><?php echo formatDate($booking['requested_date'] ?? null); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">预约面积</span>
                <span class="detail-value"><?php echo formatArea($booking['area'] ?? 0); ?></span>
            </div>
            <?php if (!empty($booking['confirmed_area'])): ?>
            <div class="detail-row">
                <span class="detail-label">确认面积</span>
                <span class="detail-value"><strong><?php echo formatArea($booking['confirmed_area']); ?></strong></span>
            </div>
            <?php endif; ?>
            <div class="detail-row">
                <span class="detail-label">面积确认状态</span>
                <span class="detail-value"><?php echo statusBadge($booking['area_status'] ?? 'pending', Booking::areaStatusLabels()); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">优先级</span>
                <span class="detail-value"><?php echo e(Booking::priorities()[$booking['priority']] ?? ($booking['priority'] ?? '-')); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">当前状态</span>
                <span class="detail-value"><?php echo statusBadge($booking['status'] ?? 'unknown', Booking::statusLabels()); ?></span>
            </div>
        </div>
        <div>
            <?php if (empty($field)): ?>
                <div class="alert alert-error">
                    <p class="text-muted">⚠️ 关联地块信息已丢失</p>
                </div>
            <?php else: ?>
            <div class="detail-row">
                <span class="detail-label">地块名称</span>
                <span class="detail-value"><?php echo e($field['name'] ?? '-'); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">地块位置</span>
                <span class="detail-value"><?php echo e($field['location'] ?? '-'); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">地块登记面积</span>
                <span class="detail-value"><strong><?php echo formatArea($field['area'] ?? 0); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作物类型</span>
                <span class="detail-value"><?php echo e($field['crop_type'] ?? '-'); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">土壤类型</span>
                <span class="detail-value"><?php echo e($field['soil_type'] ?? '-'); ?></span>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <?php
    $bookingArea = floatval($booking['area'] ?? 0);
    $fieldArea = floatval($field['area'] ?? 0);
    $areaDiff = abs($bookingArea - $fieldArea);
    $areaStatus = $booking['area_status'] ?? 'pending';
    $hasMismatch = $areaDiff > 0.01 && $areaStatus !== 'confirmed';
    ?>

    <?php if ($hasMismatch): ?>
    <div class="alert alert-warning" style="margin-top:1rem;">
        <p><strong>⚠️ 面积差异提醒</strong></p>
        <p>预约面积 <strong><?php echo formatArea($bookingArea); ?></strong> 与地块登记面积 <strong><?php echo formatArea($fieldArea); ?></strong> 不一致，差异为 <strong><?php echo formatArea($areaDiff); ?></strong> 亩。</p>
        <p class="text-sm text-muted">请核实后选择确认面积，或要求农户修正预约信息。</p>
    </div>
    <?php endif; ?>

    <?php if ($areaStatus !== 'confirmed'): ?>
    <div class="card" style="margin-top:1rem;">
        <div class="card-header">
            <h3 class="card-title">面积确认操作</h3>
        </div>
        <div style="padding:1rem;">
            <div class="grid grid-2">
                <div>
                    <p class="text-sm mb-1">确认面积用于后续排班和作业验收，确认后锁定不可更改。</p>
                    <form method="POST" action="/bookings/<?php echo $booking['id']; ?>/confirm-area">
                        <div class="form-group">
                            <label class="form-label">确认面积（亩）</label>
                            <input type="number" step="0.01" name="confirmed_area" class="form-control" value="<?php echo e((string)($booking['confirmed_area'] ?? $booking['area'] ?? '')); ?>" required>
                            <p class="text-sm text-muted">默认为预约面积 <?php echo formatArea($bookingArea); ?>，可根据实际情况调整</p>
                        </div>
                        <button type="submit" class="btn btn-success">确认面积</button>
                    </form>
                </div>
                <div>
                    <p class="text-sm mb-1">如面积有误，可要求农户重新提交预约信息。</p>
                    <form method="POST" action="/bookings/<?php echo $booking['id']; ?>/request-area-correction">
                        <div class="form-group">
                            <label class="form-label">修正说明</label>
                            <textarea name="correction_note" class="form-control" rows="3" placeholder="请说明需要修正的原因..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-danger">要求修正</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    <?php else: ?>
    <div class="alert alert-success" style="margin-top:1rem;">
        <p><strong>✅ 面积已确认</strong> — 锁定面积：<strong><?php echo formatArea($booking['confirmed_area'] ?? $booking['area']); ?></strong> 亩，将用于排班和作业验收。</p>
    </div>
    <?php endif; ?>
    
    <?php if (!empty($booking['notes'])): ?>
    <div class="detail-row">
        <span class="detail-label">备注说明</span>
        <span class="detail-value"><?php echo e($booking['notes']); ?></span>
    </div>
    <?php endif; ?>
    
    <?php endif; ?>
</div>

<?php if ($booking): ?>

<?php if (!$schedule): ?>
<div class="card">
    <div class="card-header">
        <h3 class="card-title">排班信息</h3>
    </div>
    <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p class="text-muted">该预约暂未排班</p>
    </div>
</div>
<?php else: ?>
<div class="card">
    <div class="card-header">
        <h3 class="card-title">排班信息</h3>
    </div>
    <div class="grid grid-3">
        <div class="detail-row">
            <span class="detail-label">排班日期</span>
            <span class="detail-value"><?php echo formatDate($schedule['scheduled_date'] ?? null); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">作业时间</span>
            <span class="detail-value"><?php echo e($schedule['start_time'] ?? '-'); ?> - <?php echo e($schedule['end_time'] ?? '-'); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">排班状态</span>
            <span class="detail-value"><?php echo statusBadge($schedule['status'] ?? 'unknown', Schedule::statusLabels()); ?></span>
        </div>
    </div>
</div>
<?php endif; ?>

<div class="card">
    <h3 class="card-title mb-1">状态流转</h3>
    <div class="timeline">
        <div class="timeline-item">
            <strong>预约提交</strong>
            <div class="text-sm text-muted"><?php echo formatDateTime($booking['created_at'] ?? null); ?></div>
        </div>
        <?php if (($booking['status'] ?? '') != 'pending'): ?>
        <div class="timeline-item">
            <strong><?php echo ($booking['status'] == 'cancelled' ? '预约取消' : '预约确认'); ?></strong>
        </div>
        <?php endif; ?>
        <?php if ($schedule): ?>
        <div class="timeline-item">
            <strong>已排班</strong>
        </div>
        <?php endif; ?>
        <?php if (($booking['status'] ?? '') == 'completed'): ?>
        <div class="timeline-item">
            <strong>作业完成</strong>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php endif; ?>
