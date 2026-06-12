<!DOCTYPE html>
<html>
<head>
    <title>切换用户</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        h1 { color: #1f2937; }
        .user-card { border: 1px solid #e5e7eb; padding: 16px; margin: 12px 0; border-radius: 8px; }
        .user-card.current { background: #eff6ff; border-color: #3b82f6; }
        a { color: #2563eb; text-decoration: none; font-weight: 500; }
        .role { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .role-clerk { background: #dbeafe; color: #1e40af; }
        .role-approver { background: #f3e8ff; color: #6b21a8; }
    </style>
</head>
<body>
    <h1>用户切换（演示环境）</h1>
    <p>当前登录：@if($current) {{ $current->name }} @else 未登录 @endif</p>
    @foreach($users as $user)
        <div class="user-card @if($current && $current->id == $user->id) current @endif">
            <strong>{{ $user->name }}</strong>
            <span class="role role-{{ $user->role->value }}">{{ $user->role->label() }}</span>
            <p>{{ $user->email }} · {{ $user->employee_id }} · {{ $user->department }}</p>
            <a href="{{ route('login', $user->id) }}">以此身份登录</a>
        </div>
    @endforeach
    <p style="margin-top: 30px;"><a href="{{ route('dashboard') }}">← 返回看板</a></p>
</body>
</html>
