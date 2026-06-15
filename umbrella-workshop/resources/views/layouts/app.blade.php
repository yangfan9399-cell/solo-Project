<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>纸伞作坊骨架装配游戏</title>
    <style>
        :root {
            --bg: #faf5ef;
            --fg: #3d2b1f;
            --muted: #8b7355;
            --accent: #c4463a;
            --accent2: #2d5f4a;
            --card: #fff9f2;
            --border: #e0d5c7;
            --gold: #b8860b;
            --success: #2d5f4a;
            --warning: #d4a017;
            --danger: #c4463a;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', 'Hiragino Sans GB', sans-serif;
            background: var(--bg);
            color: var(--fg);
            min-height: 100vh;
            line-height: 1.6;
        }
        .nav {
            background: linear-gradient(135deg, #3d2b1f 0%, #5a3d2e 100%);
            padding: 12px 24px;
            display: flex;
            align-items: center;
            gap: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .nav-brand {
            color: #f0e6d3;
            font-size: 20px;
            font-weight: 700;
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .nav-brand .icon { font-size: 24px; }
        .nav-links { display: flex; gap: 16px; margin-left: auto; }
        .nav-links a {
            color: #d4c5b0;
            text-decoration: none;
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s;
        }
        .nav-links a:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nav-links a.active { background: rgba(196,70,58,0.3); color: #fff; }
        .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
        .page-header {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--border);
        }
        .page-header h1 {
            font-size: 24px;
            color: var(--fg);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .page-header p { color: var(--muted); margin-top: 4px; font-size: 14px; }
        .card {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .card h2 {
            font-size: 18px;
            margin-bottom: 12px;
            color: var(--fg);
            border-left: 4px solid var(--accent);
            padding-left: 10px;
        }
        .card h3 {
            font-size: 15px;
            margin-bottom: 8px;
            color: var(--muted);
        }
        .grid { display: grid; gap: 16px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
        .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
        @media (max-width: 768px) {
            .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
        }
        .btn {
            display: inline-block;
            padding: 8px 20px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.2s;
            text-align: center;
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:hover { background: #a83830; transform: translateY(-1px); }
        .btn-success { background: var(--success); color: #fff; }
        .btn-success:hover { background: #1f4a38; }
        .btn-warning { background: var(--warning); color: #fff; }
        .btn-warning:hover { background: #b08a10; }
        .btn-danger { background: var(--danger); color: #fff; }
        .btn-danger:hover { background: #a83830; }
        .btn-outline {
            background: transparent;
            border: 2px solid var(--border);
            color: var(--fg);
        }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
        .btn-sm { padding: 4px 12px; font-size: 12px; }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        .badge-success { background: #e8f5e9; color: #2d5f4a; }
        .badge-warning { background: #fff8e1; color: #8b6914; }
        .badge-danger { background: #fde8e8; color: #c4463a; }
        .badge-info { background: #e3f2fd; color: #1565c0; }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th, td {
            padding: 10px 12px;
            text-align: left;
            border-bottom: 1px solid var(--border);
        }
        th {
            background: #f5ede3;
            color: var(--muted);
            font-weight: 600;
            font-size: 13px;
        }
        tr:hover td { background: #faf5ef; }
        .stat-bar {
            height: 8px;
            background: #e0d5c7;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 4px;
        }
        .stat-bar-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.5s ease;
        }
        .material-card {
            border: 2px solid var(--border);
            border-radius: 10px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
            background: var(--card);
        }
        .material-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .material-card.selected { border-color: var(--success); background: #f0faf5; }
        .material-card.defective { border-color: var(--warning); }
        .material-card .name { font-weight: 700; font-size: 16px; margin-bottom: 6px; }
        .material-card .meta { font-size: 12px; color: var(--muted); }
        .material-card .defect-tag { background: #fff3cd; color: #856404; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
        .step-indicator {
            display: flex;
            align-items: center;
            gap: 0;
            margin-bottom: 24px;
        }
        .step {
            padding: 8px 16px;
            background: #e0d5c7;
            color: var(--muted);
            font-size: 13px;
            font-weight: 600;
            position: relative;
        }
        .step:first-child { border-radius: 8px 0 0 8px; }
        .step:last-child { border-radius: 0 8px 8px 0; }
        .step.active { background: var(--accent); color: #fff; }
        .step.done { background: var(--success); color: #fff; }
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            font-size: 14px;
        }
        .alert-success { background: #e8f5e9; color: #2d5f4a; border: 1px solid #c8e6c9; }
        .alert-warning { background: #fff8e1; color: #8b6914; border: 1px solid #ffecb3; }
        .alert-danger { background: #fde8e8; color: #c4463a; border: 1px solid #f5c6c6; }
        .alert-info { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 14px; }
        select, input[type="text"], input[type="number"] {
            width: 100%;
            padding: 8px 12px;
            border: 2px solid var(--border);
            border-radius: 8px;
            font-size: 14px;
            background: #fff;
            color: var(--fg);
            transition: border-color 0.2s;
        }
        select:focus, input:focus { outline: none; border-color: var(--accent); }
        .pasting-order-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            margin-bottom: 4px;
            background: #f5ede3;
            border-radius: 6px;
            cursor: grab;
        }
        .pasting-order-item .step-num {
            width: 24px;
            height: 24px;
            background: var(--accent);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 700;
        }
        .humidity-meter {
            width: 100%;
            height: 24px;
            background: linear-gradient(to right, #e3f2fd 0%, #fff9c4 50%, #ffcdd2 100%);
            border-radius: 12px;
            position: relative;
            margin: 8px 0;
        }
        .humidity-indicator {
            position: absolute;
            top: -4px;
            width: 4px;
            height: 32px;
            background: var(--fg);
            border-radius: 2px;
            transform: translateX(-50%);
        }
        .humidity-label {
            font-size: 12px;
            color: var(--muted);
            display: flex;
            justify-content: space-between;
        }
        .round-state-log {
            background: #2d2d2d;
            color: #d4d4d4;
            padding: 16px;
            border-radius: 8px;
            font-family: 'Menlo', 'Monaco', monospace;
            font-size: 12px;
            overflow-x: auto;
            max-height: 300px;
            overflow-y: auto;
        }
        .round-state-log .key { color: #9cdcfe; }
        .round-state-log .string { color: #ce9178; }
        .round-state-log .number { color: #b5cea8; }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: var(--muted);
        }
        .empty-state .icon { font-size: 48px; margin-bottom: 12px; }
        .flex { display: flex; }
        .flex-between { justify-content: space-between; align-items: center; }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .text-sm { font-size: 13px; }
        .text-muted { color: var(--muted); }
        .text-center { text-align: center; }
        .text-success { color: var(--success); }
        .text-danger { color: var(--danger); }
        .text-warning { color: var(--warning); }
        .fw-bold { font-weight: 700; }
    </style>
</head>
<body>
    <nav class="nav">
        <a href="/" class="nav-brand">
            <span class="icon">☂</span> 纸伞作坊
        </a>
        <div class="nav-links">
            <a href="{{ route('games.index') }}" class="{{ request()->routeIs('games.index') ? 'active' : '' }}">作坊记录</a>
            <a href="{{ route('games.create') }}" class="{{ request()->routeIs('games.create') ? 'active' : '' }}">开工作坊</a>
            <a href="{{ route('games.history') }}" class="{{ request()->routeIs('games.history') ? 'active' : '' }}">变化历史</a>
            <a href="{{ route('games.inspections') }}" class="{{ request()->routeIs('games.inspections') ? 'active' : '' }}">质检评价</a>
        </div>
    </nav>

    <div class="container">
        @if(session('success'))
            <div class="alert alert-success">{{ session('success') }}</div>
        @endif

        @if(session('error'))
            <div class="alert alert-danger">{{ session('error') }}</div>
        @endif

        @yield('content')
    </div>
</body>
</html>
