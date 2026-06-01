<div class="card">
    <div class="card-header">
        <h1 class="card-title">新增地块</h1>
        <a href="/fields" class="btn btn-outline">返回</a>
    </div>
    
    <form method="POST" action="/fields">
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">地块名称</label>
                <input type="text" name="name" class="form-control" value="<?php echo old('name'); ?>" required>
            </div>
            <div class="form-group">
                <label class="form-label">位置</label>
                <input type="text" name="location" class="form-control" value="<?php echo old('location'); ?>">
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">面积（亩）</label>
                <input type="number" name="area" class="form-control" step="0.01" value="<?php echo old('area'); ?>" required>
            </div>
            <div class="form-group">
                <label class="form-label">作物类型</label>
                <input type="text" name="crop_type" class="form-control" value="<?php echo old('crop_type'); ?>">
            </div>
            <div class="form-group">
                <label class="form-label">土壤类型</label>
                <select name="soil_type" class="form-control">
                    <option value="">请选择</option>
                    <option value="壤土" <?php echo old('soil_type') == '壤土' ? 'selected' : ''; ?>>壤土</option>
                    <option value="黏土" <?php echo old('soil_type') == '黏土' ? 'selected' : ''; ?>>黏土</option>
                    <option value="沙壤土" <?php echo old('soil_type') == '沙壤土' ? 'selected' : ''; ?>>沙壤土</option>
                    <option value="砂土" <?php echo old('soil_type') == '砂土' ? 'selected' : ''; ?>>砂土</option>
                </select>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">备注</label>
            <textarea name="notes" class="form-control" rows="3"><?php echo old('notes'); ?></textarea>
        </div>
        
        <div class="flex justify-between">
            <a href="/fields" class="btn btn-outline">取消</a>
            <button type="submit" class="btn btn-primary">保存</button>
        </div>
    </form>
</div>
