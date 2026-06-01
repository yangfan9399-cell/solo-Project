<div class="login-container">
    <div class="login-card">
        <h2 class="login-title">用户登录</h2>
        
        <?php if (isset($errors['email'])): ?>
            <div class="alert alert-error"><?php echo e($errors['email']); ?></div>
        <?php endif; ?>
        
        <form method="POST" action="/login">
            <div class="form-group">
                <label class="form-label">邮箱</label>
                <input type="email" name="email" class="form-control" value="<?php echo old('email'); ?>" required>
            </div>
            <div class="form-group">
                <label class="form-label">密码</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary w-100">登录</button>
        </form>
        
        <div class="mt-2 text-sm text-muted">
            <p><strong>测试账号：</strong></p>
            <p>管理员: admin@example.com / admin123</p>
            <p>农户: farmer1@example.com / farmer123</p>
            <p>农机手: operator1@example.com / operator123</p>
            <p>财务: finance@example.com / finance123</p>
        </div>
    </div>
</div>
