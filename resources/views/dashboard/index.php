<div class="mb-2">
    <h1>仪表盘</h1>
    <p class="text-muted">欢迎回来，<?php echo e(Auth::user()['name']); ?></p>
</div>

<div class="grid grid-4">
    <div class="stat-card">
        <div class="stat-value"><?php echo $stats['total_bookings']; ?></div>
        <div class="stat-label">总预约数</div>
    </div>
    <div class="stat-card">
        <div class="stat-value"><?php echo $stats['pending_bookings']; ?></div>
        <div class="stat-label">待处理预约</div>
    </div>
    <div class="stat-card">
        <div class="stat-value"><?php echo $stats['today_schedules']; ?></div>
        <div class="stat-label">今日排班</div>
    </div>
    <div class="stat-card">
        <div class="stat-value"><?php echo $stats['open_exceptions']; ?></div>
        <div class="stat-label">待处理异常</div>
    </div>
</div>

<div class="grid grid-2 mt-2">
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">最近预约</h3>
            <a href="/bookings" class="btn btn-sm btn-outline">查看全部</a>
        </div>
        <?php if (empty($recentBookings)): ?>
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>暂无预约记录</p>
            </div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>预约号</th>
                        <th>作业类型</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recentBookings as $booking): ?>
                    <tr>
                        <td><?php echo e($booking['booking_no']); ?></td>
                        <td><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? $booking['operation_type']); ?></td>
                        <td><?php echo statusBadge($booking['status'], Booking::statusLabels()); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">今日排班</h3>
            <a href="/schedules/calendar" class="btn btn-sm btn-outline">查看日历</a>
        </div>
        <?php if (empty($todaySchedules)): ?>
            <div class="empty-state">
                <div class="empty-state-icon">📅</div>
                <p>今日暂无排班</p>
            </div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>时间</th>
                        <th>农机</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($todaySchedules as $schedule): ?>
                    <tr>
                        <td><?php echo e($schedule['start_time']); ?> - <?php echo e($schedule['end_time']); ?></td>
                        <td>农机 #<?php echo $schedule['machine_id']; ?></td>
                        <td><?php echo statusBadge($schedule['status'], Schedule::statusLabels()); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<div class="grid grid-3">
    <div class="stat-card">
        <div class="stat-value"><?php echo $stats['pending_jobs']; ?></div>
        <div class="stat-label">待验收作业</div>
    </div>
    <div class="stat-card">
        <div class="stat-value"><?php echo formatMoney($stats['total_subsidies'] > 0 ? 15000 : 0); ?></div>
        <div class="stat-label">已发放油补</div>
    </div>
    <div class="stat-card">
        <div class="stat-value"><?php echo $stats['unpaid_settlements']; ?></div>
        <div class="stat-label">待结算订单</div>
    </div>
</div>
