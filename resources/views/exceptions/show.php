<div class="card">
    <div class="card-header">
        <h1 class="card-title">异常详情</h1>
        <a href="/exceptions" class="btn btn-outline">返回列表</a>
    </div>
    
    <?php if (!$exception): ?>
        <div class="alert alert-error">
            <p><strong>错误：</strong>异常记录不存在或已被删除。</p>
            <a href="/exceptions" class="btn btn-sm btn-outline mt-1">返回异常列表</a>
        </div>
    <?php else: ?>
    
    <div class="grid grid-2">
        <div>
            <div class="detail-row">
                <span class="detail-label">异常编号</span>
                <span class="detail-value"><strong><?php echo e($exception['exception_no'] ?? '-'); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">异常类型</span>
                <span class="detail-value"><?php echo e(ExceptionRecord::types()[$exception['type']] ?? ($exception['type'] ?? '-')); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">当前状态</span>
                <span class="detail-value"><?php echo statusBadge($exception['status'] ?? 'unknown', ExceptionRecord::statusLabels()); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">提交时间</span>
                <span class="detail-value"><?php echo formatDateTime($exception['created_at'] ?? null); ?></span>
            </div>
        </div>
        <div>
            <div class="detail-row">
                <span class="detail-label">异常标题</span>
                <span class="detail-value"><strong><?php echo e($exception['title'] ?? '-'); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">关联排班</span>
                <span class="detail-value"><?php echo !empty($exception['schedule_id']) ? '排班 #' . $exception['schedule_id'] : '无'; ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">处理人</span>
                <span class="detail-value"><?php echo !empty($exception['handler_id']) ? '用户#' . $exception['handler_id'] : '待分配'; ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">解决时间</span>
                <span class="detail-value"><?php echo formatDateTime($exception['resolved_at'] ?? null); ?></span>
            </div>
        </div>
    </div>
    
    <div class="detail-row">
        <span class="detail-label">详细描述</span>
        <span class="detail-value"><?php echo e($exception['description'] ?? '-'); ?></span>
    </div>
    
    <?php if (!empty($exception['resolution'])): ?>
    <div class="detail-row" style="background:#f0fdf4;padding:1rem;border-radius:8px;">
        <span class="detail-label"><strong>处理方案</strong></span>
        <span class="detail-value"><?php echo e($exception['resolution']); ?></span>
    </div>
    <?php endif; ?>
    
    <?php if (($exception['status'] ?? '') == 'open' || ($exception['status'] ?? '') == 'in_progress'): ?>
    <div class="mt-2">
        <form method="POST" action="/exceptions/<?php echo $exception['id']; ?>/resolve">
            <div class="form-group">
                <label class="form-label">处理方案</label>
                <textarea name="resolution" class="form-control" rows="3" required></textarea>
            </div>
            <button type="submit" class="btn btn-success">标记已解决</button>
        </form>
    </div>
    <?php endif; ?>
    
    <?php endif; ?>
</div>
