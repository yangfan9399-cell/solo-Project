<div class="card">
    <div class="card-header">
        <h1 class="card-title">油补核算</h1>
        <a href="/subsidies" class="btn btn-outline">返回</a>
    </div>
    
    <form method="POST" action="/subsidies">
        <div class="form-group">
            <label class="form-label">选择已验收的作业</label>
            <select name="job_record_id" class="form-control" required>
                <option value="">请选择作业记录</option>
                <?php foreach ($jobs as $job): ?>
                <option value="<?php echo $job['id']; ?>">
                    作业#<?php echo $job['id']; ?> - 实际面积: <?php echo formatArea($job['actual_area']); ?>
                </option>
                <?php endforeach; ?>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label">备注</label>
            <textarea name="notes" class="form-control" rows="3"><?php echo old('notes'); ?></textarea>
        </div>
        
        <div class="flex justify-between">
            <a href="/subsidies" class="btn btn-outline">取消</a>
            <button type="submit" class="btn btn-primary">开始核算</button>
        </div>
    </form>
</div>
