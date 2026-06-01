<div class="card">
    <div class="card-header">
        <h1 class="card-title">作业验收</h1>
    </div>
    
    <?php if (empty($jobs)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <p>暂无待验收的作业</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>作业记录ID</th>
                    <th>签到时间</th>
                    <th>签退时间</th>
                    <th>实际面积</th>
                    <th>质量评分</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($jobs as $job): ?>
                <tr>
                    <td>#<?php echo $job['id']; ?></td>
                    <td><?php echo formatDateTime($job['checkin_time']); ?></td>
                    <td><?php echo formatDateTime($job['checkout_time']); ?></td>
                    <td><?php echo formatArea($job['actual_area']); ?></td>
                    <td><?php echo $job['quality_rating'] ? str_repeat('⭐', $job['quality_rating']) : '-'; ?></td>
                    <td><?php echo statusBadge($job['status'], JobRecord::statusLabels()); ?></td>
                    <td>
                        <a href="/jobs/<?php echo $job['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
