<div class="card">
    <div class="card-header">
        <h1 class="card-title">作业验收详情</h1>
        <a href="/jobs" class="btn btn-outline">返回列表</a>
    </div>
    
    <?php if (!$job): ?>
        <div class="alert alert-error">
            <p><strong>错误：</strong>作业记录不存在或已被删除。</p>
            <a href="/jobs" class="btn btn-sm btn-outline mt-1">返回作业列表</a>
        </div>
    <?php else: ?>
    
    <div class="grid grid-2">
        <div>
            <div class="detail-row">
                <span class="detail-label">作业记录ID</span>
                <span class="detail-value">#<?php echo $job['id'] ?? '-'; ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">签到时间</span>
                <span class="detail-value"><?php echo formatDateTime($job['checkin_time'] ?? null); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">签退时间</span>
                <span class="detail-value"><?php echo formatDateTime($job['checkout_time'] ?? null); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">实际作业面积</span>
                <span class="detail-value"><?php echo formatArea($job['actual_area'] ?? 0); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">耗油量</span>
                <span class="detail-value"><?php echo e($job['fuel_used'] ?? '-'); ?> 升</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">质量评分</span>
                <span class="detail-value"><?php echo !empty($job['quality_rating']) ? str_repeat('⭐', $job['quality_rating']) : '-'; ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">验收状态</span>
                <span class="detail-value"><?php echo statusBadge($job['status'] ?? 'unknown', JobRecord::statusLabels()); ?></span>
            </div>
        </div>
        <div>
            <?php if (empty($booking)): ?>
                <div class="alert alert-error">
                    <p class="text-muted">⚠️ 关联预约信息已丢失</p>
                </div>
            <?php else: ?>
            <div class="detail-row">
                <span class="detail-label">预约号</span>
                <span class="detail-value"><?php echo e($booking['booking_no'] ?? '-'); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业类型</span>
                <span class="detail-value"><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? ($booking['operation_type'] ?? '-')); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">排班日期</span>
                <span class="detail-value"><?php echo formatDate($schedule['scheduled_date'] ?? null); ?></span>
            </div>
            <?php endif; ?>
            <div class="detail-row">
                <span class="detail-label">验收人</span>
                <span class="detail-value"><?php echo !empty($job['inspector_id']) ? '用户#' . $job['inspector_id'] : '-'; ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">验收时间</span>
                <span class="detail-value"><?php echo formatDateTime($job['inspected_at'] ?? null); ?></span>
            </div>
        </div>
    </div>
    
    <?php if (!empty($job['inspection_notes'])): ?>
    <div class="detail-row">
        <span class="detail-label">验收意见</span>
        <span class="detail-value"><?php echo e($job['inspection_notes']); ?></span>
    </div>
    <?php endif; ?>
    
    <?php if (($job['status'] ?? '') == 'pending'): ?>
    <div class="mt-2 flex gap-1">
        <form method="POST" action="/jobs/<?php echo $job['id']; ?>/approve" onsubmit="return confirm('确定验收通过？');">
            <input type="hidden" name="inspection_notes" value="作业质量合格，验收通过">
            <button type="submit" class="btn btn-success">验收通过</button>
        </form>
        <form method="POST" action="/jobs/<?php echo $job['id']; ?>/reject" onsubmit="return prompt('请输入驳回原因：');">
            <input type="hidden" name="inspection_notes" value="作业质量不达标，需要返工">
            <button type="submit" class="btn btn-danger">验收驳回</button>
        </form>
    </div>
    <?php endif; ?>
    
    <?php endif; ?>
</div>
