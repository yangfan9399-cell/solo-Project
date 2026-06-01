<div class="card">
    <div class="card-header">
        <h1 class="card-title">新建作业预约</h1>
        <a href="/bookings" class="btn btn-outline">返回</a>
    </div>
    
    <form method="POST" action="/bookings">
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">选择地块</label>
                <select name="field_id" class="form-control" required>
                    <option value="">请选择地块</option>
                    <?php foreach ($fields as $field): ?>
                    <option value="<?php echo $field['id']; ?>" <?php echo old('field_id') == $field['id'] ? 'selected' : ''; ?>>
                        <?php echo e($field['name']); ?> (<?php echo formatArea($field['area']); ?>)
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">作业类型</label>
                <select name="operation_type" class="form-control" required>
                    <option value="">请选择作业类型</option>
                    <?php foreach ($operationTypes as $key => $label): ?>
                    <option value="<?php echo $key; ?>" <?php echo old('operation_type') == $key ? 'selected' : ''; ?>>
                        <?php echo e($label); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">预约日期</label>
                <input type="date" name="requested_date" class="form-control" value="<?php echo old('requested_date', date('Y-m-d', strtotime('+3 days'))); ?>" required>
            </div>
            <div class="form-group">
                <label class="form-label">作业面积（亩）</label>
                <input type="number" name="area" class="form-control" step="0.01" value="<?php echo old('area'); ?>" required>
            </div>
            <div class="form-group">
                <label class="form-label">优先级</label>
                <select name="priority" class="form-control">
                    <?php foreach ($priorities as $key => $label): ?>
                    <option value="<?php echo $key; ?>" <?php echo old('priority', 'normal') == $key ? 'selected' : ''; ?>>
                        <?php echo e($label); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">备注说明</label>
            <textarea name="notes" class="form-control" rows="3"><?php echo old('notes'); ?></textarea>
        </div>
        
        <div class="flex justify-between">
            <a href="/bookings" class="btn btn-outline">取消</a>
            <button type="submit" class="btn btn-primary">提交预约</button>
        </div>
    </form>
</div>
