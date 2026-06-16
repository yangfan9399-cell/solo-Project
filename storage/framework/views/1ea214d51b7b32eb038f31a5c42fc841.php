<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">
    <title><?php echo e(config('app.name', 'Cipher Museum')); ?> - <?php echo $__env->yieldContent('title', '密码博物馆'); ?></title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #e4e4e7;
            min-height: 100vh;
        }
        a { color: #60a5fa; text-decoration: none; }
        a:hover { color: #93c5fd; }
        .navbar {
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(99, 102, 241, 0.3);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .navbar-brand {
            font-size: 1.4rem;
            font-weight: 700;
            color: #a5b4fc;
            letter-spacing: 0.05em;
        }
        .navbar-brand span { color: #fbbf24; }
        .nav-links { display: flex; gap: 1.5rem; align-items: center; }
        .nav-links a { color: #cbd5e1; font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover { color: #a5b4fc; }
        .btn {
            display: inline-block;
            padding: 0.6rem 1.2rem;
            border-radius: 0.5rem;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            font-size: 0.95rem;
        }
        .btn-primary {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
        .btn-secondary {
            background: rgba(148, 163, 184, 0.2);
            color: #e2e8f0;
            border: 1px solid rgba(148, 163, 184, 0.3);
        }
        .btn-secondary:hover { background: rgba(148, 163, 184, 0.3); }
        .btn-danger {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
        }
        .btn-danger:hover { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); }
        .btn-success {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
        }
        .btn-success:hover { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }
        .btn-warning {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .card {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 1rem;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
        }
        .card-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #a5b4fc;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 1px solid rgba(99, 102, 241, 0.2);
        }
        .grid { display: grid; gap: 1.5rem; }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
        @media (max-width: 1024px) {
            .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
            .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #cbd5e1;
        }
        .form-control {
            width: 100%;
            padding: 0.6rem 0.9rem;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 0.5rem;
            color: #e4e4e7;
            font-size: 1rem;
        }
        .form-control:focus {
            outline: none;
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.6rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .badge-easy { background: #10b981; color: white; }
        .badge-medium { background: #f59e0b; color: white; }
        .badge-hard { background: #ef4444; color: white; }
        .badge-expert { background: #8b5cf6; color: white; }
        .text-success { color: #10b981; }
        .text-danger { color: #ef4444; }
        .text-warning { color: #f59e0b; }
        .text-info { color: #3b82f6; }
        .text-muted { color: #64748b; }
        .stat-card {
            text-align: center;
            padding: 1.25rem;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #fbbf24;
        }
        .stat-label {
            font-size: 0.85rem;
            color: #94a3b8;
            margin-top: 0.25rem;
        }
        .alert {
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1rem;
        }
        .alert-success {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid #10b981;
            color: #6ee7b7;
        }
        .alert-error {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid #ef4444;
            color: #fca5a5;
        }
        .alert-warning {
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid #f59e0b;
            color: #fcd34d;
        }
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        .modal-overlay.active { display: flex; }
        .modal {
            background: #1e293b;
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 1rem;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .modal-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #a5b4fc;
            margin-bottom: 1rem;
        }
        .spacer { height: 1rem; }
        .flex { display: flex; }
        .flex-wrap { flex-wrap: wrap; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .justify-end { justify-content: flex-end; }
        .gap-2 { gap: 0.5rem; }
        .gap-3 { gap: 0.75rem; }
        .gap-4 { gap: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .mt-4 { margin-top: 1rem; }
        .mb-2 { margin-bottom: 0.5rem; }
        .mb-3 { margin-bottom: 0.75rem; }
        .mb-4 { margin-bottom: 1rem; }
        .w-full { width: 100%; }
        .text-right { text-align: right; }
        .font-mono {
            font-family: 'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace;
        }
        .text-sm { font-size: 0.85rem; }
        .text-lg { font-size: 1.125rem; }
        .text-xl { font-size: 1.25rem; }
        .text-2xl { font-size: 1.5rem; }
        .font-bold { font-weight: 700; }
        .list-none { list-style: none; }
    </style>
    <?php echo $__env->yieldContent('styles'); ?>
</head>
<body>
    <nav class="navbar">
        <a href="<?php echo e(url('/')); ?>" class="navbar-brand">
            🔐 <span>密码</span>博物馆
        </a>
        <div class="nav-links">
            <?php if(auth()->guard()->check()): ?>
                <a href="<?php echo e(route('dashboard')); ?>">控制台</a>
                <a href="<?php echo e(route('profile')); ?>">个人资料</a>
                <form method="POST" action="<?php echo e(route('logout')); ?>" style="display: inline;">
                    <?php echo csrf_field(); ?>
                    <button type="submit" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                        退出 (<?php echo e(Auth::user()->name); ?>)
                    </button>
                </form>
            <?php else: ?>
                <a href="<?php echo e(route('login')); ?>">登录</a>
                <a href="<?php echo e(route('register')); ?>" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">注册</a>
            <?php endif; ?>
        </div>
    </nav>

    <main class="container">
        <?php if(session('success')): ?>
            <div class="alert alert-success"><?php echo e(session('success')); ?></div>
        <?php endif; ?>
        <?php if(session('error')): ?>
            <div class="alert alert-error"><?php echo e(session('error')); ?></div>
        <?php endif; ?>
        <?php if($errors->any()): ?>
            <div class="alert alert-error">
                <?php $__currentLoopData = $errors->all(); $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $error): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <div><?php echo e($error); ?></div>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </div>
        <?php endif; ?>

        <?php echo $__env->yieldContent('content'); ?>
    </main>

    <script>
        window.csrfToken = document.querySelector('meta[name="csrf-token"]').content;

        async function apiCall(url, method = 'POST', data = {}) {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': window.csrfToken,
                    'Accept': 'application/json',
                },
                body: method !== 'GET' ? JSON.stringify(data) : undefined,
            });
            return response.json();
        }

        function showModal(id) {
            document.getElementById(id).classList.add('active');
        }
        function hideModal(id) {
            document.getElementById(id).classList.remove('active');
        }
    </script>
    <?php echo $__env->yieldContent('scripts'); ?>
</body>
</html>
<?php /**PATH /Users/yangfan/Desktop/trae-solo-generated-projects/q-333/resources/views/layouts/app.blade.php ENDPATH**/ ?>