<div class="card">
    <div class="card-header">
        <h1 class="card-title">作业任务</h1>
    </div>
    
    <?php if (empty($schedules)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">🛠️</div>
            <p>暂无待执行的作业任务</p>
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
                        <?php if ($schedule['status'] == 'scheduled'): ?>
                            <form method="POST" action="/assignments/<?php echo $schedule['id']; ?>/checkin" style="display:inline;">
                                <button type="submit" class="btn btn-sm btn-success">签到开始</button>
                            </form>
                        <?php elseif ($schedule['status'] == 'in_progress'): ?>
                            <button type="button" class="btn btn-sm btn-warning" onclick="showCheckoutForm(<?php echo $schedule['id']; ?>)">签退完成</button>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>

<div id="checkoutModal" style="display:none;">
    <div class="card" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:1000;min-width:400px;">
        <div class="card-header">
            <h3 class="card-title">作业签退</h3>
        </div>
        <form id="checkoutForm" method="POST">
            <div class="form-group">
                <label class="form-label">实际作业面积（亩）</label>
                <input type="number" name="actual_area" class="form-control" step="0.01" required>
            </div>
            <div class="form-group">
                <label class="form-label">耗油量（升）</label>
                <input type="number" name="fuel_used" class="form-control" step="0.01" required>
            </div>
            <div class="form-group">
                <label class="form-label">作业质量评分（1-5）</label>
                <select name="quality_rating" class="form-control">
                    <option value="5">5 - 优秀</option>
                    <option value="4">4 - 良好</option>
                    <option value="3">3 - 一般</option>
                    <option value="2">2 - 较差</option>
                    <option value="1">1 - 很差</option>
                </select>
            </div>
            <div class="flex justify-between gap-1">
                <button type="button" class="btn btn-outline" onclick="hideCheckoutForm()">取消</button>
                <button type="submit" class="btn btn-primary">确认签退</button>
            </div>
        </form>
    </div>
</div>

<script>
function showCheckoutForm(id) {
    document.getElementById('checkoutModal').style.display = 'block';
    document.getElementById('checkoutForm').action = '/assignments/' + id + '/checkout';
}
function hideCheckoutForm() {
    document.getElementById('checkoutModal').style.display = 'none';
}
</script>
