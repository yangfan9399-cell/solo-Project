<div class="card">
    <div class="card-header">
        <h1 class="card-title">油补核算详情</h1>
        <a href="/subsidies" class="btn btn-outline">返回列表</a>
    </div>
    
    <?php if (!$subsidy): ?>
        <div class="alert alert-error">
            <p><strong>错误：</strong>油补核算记录不存在或已被删除。</p>
            <a href="/subsidies" class="btn btn-sm btn-outline mt-1">返回油补列表</a>
        </div>
    <?php else: ?>
    
    <div class="grid grid-2">
        <div>
            <div class="detail-row">
                <span class="detail-label">核算编号</span>
                <span class="detail-value"><strong><?php echo e($subsidy['subsidy_no'] ?? '-'); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业类型</span>
                <span class="detail-value"><?php echo e(Booking::operationTypes()[$subsidy['operation_type']] ?? ($subsidy['operation_type'] ?? '-')); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">核算面积</span>
                <span class="detail-value"><?php echo formatArea($subsidy['area'] ?? 0); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">核算状态</span>
                <span class="detail-value"><?php echo statusBadge($subsidy['status'] ?? 'unknown', Subsidy::statusLabels()); ?></span>
            </div>
        </div>
        <div>
            <div class="detail-row">
                <span class="detail-label">燃油补贴标准</span>
                <span class="detail-value"><?php echo e($subsidy['fuel_subsidy_rate'] ?? '-'); ?> 元/升</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">燃油补贴金额</span>
                <span class="detail-value"><?php echo formatMoney($subsidy['fuel_subsidy_amount'] ?? 0); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业补贴标准</span>
                <span class="detail-value"><?php echo e($subsidy['operation_subsidy_rate'] ?? '-'); ?> 元/亩</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">作业补贴金额</span>
                <span class="detail-value"><?php echo formatMoney($subsidy['operation_subsidy_amount'] ?? 0); ?></span>
            </div>
        </div>
    </div>
    
    <div class="detail-row" style="background:#f8f9fa;padding:1rem;border-radius:8px;">
        <span class="detail-label"><strong>补贴合计</strong></span>
        <span class="detail-value"><strong style="font-size:1.5rem;color:#4a7c23;"><?php echo formatMoney($subsidy['total_subsidy'] ?? 0); ?></strong></span>
    </div>
    
    <?php if (!empty($subsidy['notes'])): ?>
    <div class="detail-row">
        <span class="detail-label">备注</span>
        <span class="detail-value"><?php echo e($subsidy['notes']); ?></span>
    </div>
    <?php endif; ?>
    
    <?php endif; ?>
</div>

<?php if ($subsidy): ?>

<div class="card">
    <h3 class="card-title mb-1">关联作业信息</h3>
    <?php if (empty($job)): ?>
        <div class="empty-state">
            <p class="text-muted">⚠️ 关联作业信息已丢失</p>
        </div>
    <?php else: ?>
    <div class="grid grid-3">
        <div class="detail-row">
            <span class="detail-label">签到时间</span>
            <span class="detail-value"><?php echo formatDateTime($job['checkin_time'] ?? null); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">签退时间</span>
            <span class="detail-value"><?php echo formatDateTime($job['checkout_time'] ?? null); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">实际耗油量</span>
            <span class="detail-value"><?php echo e($job['fuel_used'] ?? '-'); ?> 升</span>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php endif; ?>
