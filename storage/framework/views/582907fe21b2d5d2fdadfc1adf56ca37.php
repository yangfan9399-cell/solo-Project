<?php $__env->startSection('title', '欢迎'); ?>

<?php $__env->startSection('content'); ?>
<div style="text-align: center; padding: 4rem 0;">
    <div style="font-size: 5rem; margin-bottom: 1rem;">🔐</div>
    <h1 style="font-size: 3rem; margin-bottom: 1rem; background: linear-gradient(135deg, #a5b4fc, #fbbf24); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        密码博物馆
    </h1>
    <p style="font-size: 1.25rem; color: #94a3b8; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">
        化身密码破译者，通过频率分析、替换表推理和转轮设置，
        破译历史上最神秘的密码谜题。
    </p>

    <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 4rem;">
        <?php if(auth()->guard()->check()): ?>
            <a href="<?php echo e(route('dashboard')); ?>" class="btn btn-primary">开始挑战</a>
        <?php else: ?>
            <a href="<?php echo e(route('register')); ?>" class="btn btn-primary">立即注册</a>
            <a href="<?php echo e(route('login')); ?>" class="btn btn-secondary">已有账号登录</a>
        <?php endif; ?>
    </div>

    <div class="grid grid-3" style="max-width: 1000px; margin: 0 auto;">
        <div class="card">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📊</div>
            <h3 class="card-title">频率分析</h3>
            <p class="text-muted">利用字母出现频率统计，结合英文标准频率，推测替换密码的映射关系。</p>
        </div>
        <div class="card">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚙️</div>
            <h3 class="card-title">转轮密码</h3>
            <p class="text-muted">模拟经典转轮密码机，调整转轮位置，逐步推导出正确的解密配置。</p>
        </div>
        <div class="card">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">📝</div>
            <h3 class="card-title">推理笔记</h3>
            <p class="text-muted">记录推理过程，保存临时假设，结合操作历史追踪你的思维轨迹。</p>
        </div>
    </div>

    <div class="card" style="max-width: 800px; margin: 3rem auto 0;">
        <h3 class="card-title">🎮 游戏玩法</h3>
        <div style="text-align: left; line-height: 1.8;">
            <p>1. 选择关卡，根据难度获取不同的基础分数。</p>
            <p>2. 在密文分析面板查看字母频率、双字母组、三字母组统计。</p>
            <p>3. 在替换表中设置密文字母到明文字母的映射，实时预览解密结果。</p>
            <p>4. 对于转轮密码，调整每个转轮的初始位置来解密。</p>
            <p>5. 可以使用提示，但每次会扣除分数。</p>
            <p>6. 所有操作都可以撤销，记录推理笔记帮助思考。</p>
            <p>7. 确认解密正确后提交答案，获得最终分数！</p>
        </div>
    </div>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/yangfan/Desktop/trae-solo-generated-projects/q-333/resources/views/welcome.blade.php ENDPATH**/ ?>