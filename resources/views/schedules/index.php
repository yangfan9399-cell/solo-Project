<div class="card">
    <div class="card-header">
        <h1 class="card-title">排班管理</h1>
        <a href="/schedules/calendar" class="btn btn-primary">日历视图</a>
    </div>
    
    <?php if (empty($schedules)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">📅</div>
            <p>暂无排班</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>排班日期</th>
                    <th>时间</th>
                    <th>预约号</th>
                    <th>农机</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($schedules as $schedule): ?>
                <tr>
                    <td><?php echo formatDate($schedule['scheduled_date']); ?></td>
                    <td><?php echo e($schedule['start_time']); ?> - <?php echo e($schedule['end_time']); ?></td>
                    <td>BK-<?php echo $schedule['booking_id']; ?></td>
                    <td>农机 #<?php echo $schedule['machine_id']; ?></td>
                    <td><?php echo statusBadge($schedule['status'], Schedule::statusLabels()); ?></td>
                    <td>
                        <form method="POST" action="/schedules/<?php echo $schedule['id']; ?>/delete" style="display:inline;" onsubmit="return confirm('确定要取消排班吗？');">
                            <button type="submit" class="btn btn-sm btn-danger">取消</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
