<div class="card">
    <div class="card-header">
        <h1 class="card-title">提交异常反馈</h1>
        <a href="/exceptions" class="btn btn-outline">返回</a>
    </div>
    
    <form method="POST" action="/exceptions">
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">异常类型</label>
                <select name="type" class="form-control" required>
                    <option value="">请选择类型</option>
                    <?php foreach ($types as $key => $label): ?>
                    <option value="<?php echo $key; ?>" <?php echo old('type') == $key ? 'selected' : ''; ?>>
                        <?php echo e($label); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">关联排班（可选）</label>
                <select name="schedule_id" class="form-control">
                    <option value="">无</option>
                    <?php foreach ($schedules as $schedule): ?>
                    <option value="<?php echo $schedule['id']; ?>" <?php echo old('schedule_id') == $schedule['id'] ? 'selected' : ''; ?>>
                        排班 #<?php echo $schedule['id']; ?> - <?php echo formatDate($schedule['scheduled_date']); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">异常标题</label>
            <input type="text" name="title" class="form-control" value="<?php echo old('title'); ?>" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">详细描述</label>
            <textarea name="description" class="form-control" rows="5" required><?php echo old('description'); ?></textarea>
        </div>
        
        <div class="flex justify-between">
            <a href="/exceptions" class="btn btn-outline">取消</a>
            <button type="submit" class="btn btn-primary">提交反馈</button>
        </div>
    </form>
</div>
