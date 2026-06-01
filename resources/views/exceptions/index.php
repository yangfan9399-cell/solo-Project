<div class="card">
    <div class="card-header">
        <h1 class="card-title">异常反馈</h1>
        <a href="/exceptions/create" class="btn btn-primary">提交异常</a>
    </div>
    
    <?php if (empty($exceptions)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <p>暂无异常记录</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>异常编号</th>
                    <th>类型</th>
                    <th>标题</th>
                    <th>状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($exceptions as $exception): ?>
                <tr>
                    <td><strong><?php echo e($exception['exception_no']); ?></strong></td>
                    <td><?php echo e(ExceptionRecord::types()[$exception['type']] ?? $exception['type']); ?></td>
                    <td><?php echo e($exception['title']); ?></td>
                    <td><?php echo statusBadge($exception['status'], ExceptionRecord::statusLabels()); ?></td>
                    <td><?php echo formatDateTime($exception['created_at']); ?></td>
                    <td>
                        <a href="/exceptions/<?php echo $exception['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
