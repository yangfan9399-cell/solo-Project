<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>农机合作社管理系统</title>
    <link rel="stylesheet" href="/css/app.css">
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
    <?php if (Auth::check()): ?>
    <nav class="navbar">
        <div class="navbar-content">
            <a href="/dashboard" class="navbar-brand">🌾 农机合作社</a>
            <ul class="navbar-nav">
                <li><a href="/dashboard">首页</a></li>
                <li><a href="/bookings">作业预约</a></li>
                <li><a href="/fields">地块管理</a></li>
                <li><a href="/machines">农机管理</a></li>
                <li><a href="/schedules/calendar">排班日历</a></li>
                <li><a href="/assignments">作业任务</a></li>
                <li><a href="/jobs">作业验收</a></li>
                <li><a href="/subsidies">油补核算</a></li>
                <li><a href="/settlements">费用结算</a></li>
                <li><a href="/exceptions">异常反馈</a></li>
                <li class="dropdown">
                    <a href="#"><?php echo e(Auth::user()['name']); ?> ▾</a>
                    <div class="dropdown-menu">
                        <span class="dropdown-item"><?php echo roleLabel(Auth::role()); ?></span>
                        <a href="/logout" class="dropdown-item">退出登录</a>
                    </div>
                </li>
            </ul>
        </div>
    </nav>
    <?php endif; ?>

    <div class="container">
        <?php if (isset($flash['success'])): ?>
            <div class="alert alert-success"><?php echo e($flash['success']); ?></div>
        <?php endif; ?>
        
        <?php if (isset($flash['error'])): ?>
            <div class="alert alert-error"><?php echo e($flash['error']); ?></div>
        <?php endif; ?>

        <?php echo $content; ?>
    </div>
</body>
</html>
