<div class="card">
    <div class="card-header">
        <h1 class="card-title">作业预约</h1>
        <a href="/bookings/create" class="btn btn-primary">新建预约</a>
    </div>
    
    <?php if (empty($bookings)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>暂无预约记录</p>
            <a href="/bookings/create" class="btn btn-primary mt-2">创建第一个预约</a>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>预约号</th>
                    <th>地块</th>
                    <th>作业类型</th>
                    <th>预约日期</th>
                    <th>面积</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($bookings as $booking): ?>
                <tr>
                    <td><strong><?php echo e($booking['booking_no']); ?></strong></td>
                    <td><?php echo e($fields[$booking['field_id']]['name'] ?? '未知'); ?></td>
                    <td><?php echo e(Booking::operationTypes()[$booking['operation_type']] ?? $booking['operation_type']); ?></td>
                    <td><?php echo formatDate($booking['requested_date']); ?></td>
                    <td><?php echo formatArea($booking['area']); ?></td>
                    <td><?php echo statusBadge($booking['status'], Booking::statusLabels()); ?></td>
                    <td>
                        <a href="/bookings/<?php echo $booking['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                        <?php if ($booking['status'] == 'pending'): ?>
                            <form method="POST" action="/bookings/<?php echo $booking['id']; ?>/confirm" style="display:inline;">
                                <button type="submit" class="btn btn-sm btn-success">确认</button>
                            </form>
                            <form method="POST" action="/bookings/<?php echo $booking['id']; ?>/cancel" style="display:inline;">
                                <button type="submit" class="btn btn-sm btn-danger">取消</button>
                            </form>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
