<?php $__env->startSection('title', '注册'); ?>

<?php $__env->startSection('content'); ?>
<div style="max-width: 400px; margin: 3rem auto;">
    <div class="card">
        <h2 class="card-title">✨ 创建账号</h2>
        <form method="POST" action="<?php echo e(route('register')); ?>">
            <?php echo csrf_field(); ?>
            <div class="form-group">
                <label>用户名</label>
                <input type="text" name="name" class="form-control" value="<?php echo e(old('name')); ?>" required autofocus>
            </div>
            <div class="form-group">
                <label>邮箱地址</label>
                <input type="email" name="email" class="form-control" value="<?php echo e(old('email')); ?>" required>
            </div>
            <div class="form-group">
                <label>密码</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            <div class="form-group">
                <label>确认密码</label>
                <input type="password" name="password_confirmation" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-primary w-full">注册</button>
        </form>
        <div class="mt-4 text-center text-sm">
            已有账号？<a href="<?php echo e(route('login')); ?>">立即登录</a>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/yangfan/Desktop/trae-solo-generated-projects/q-333/resources/views/auth/register.blade.php ENDPATH**/ ?>