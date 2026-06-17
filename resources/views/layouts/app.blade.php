<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '传统榨油坊批次压榨记录系统')</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            background: #f5f3ef;
            color: #2d2a24;
            line-height: 1.6;
        }
        .app-container { display: flex; min-height: 100vh; }
        .sidebar {
            width: 250px;
            background: linear-gradient(180deg, #6b4423 0%, #8b5a2b 100%);
            color: #f5e6d3;
            padding: 0;
            position: fixed;
            height: 100vh;
            overflow-y: auto;
        }
        .sidebar-logo {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-logo h1 {
            font-size: 18px;
            font-weight: 700;
            color: #fff8ee;
            letter-spacing: 1px;
        }
        .sidebar-logo p {
            font-size: 12px;
            color: #e8d5bc;
            margin-top: 4px;
        }
        .sidebar-nav { margin-top: 16px; }
        .sidebar-nav a {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            color: #f5e6d3;
            text-decoration: none;
            font-size: 14px;
            transition: all 0.2s;
            border-left: 3px solid transparent;
        }
        .sidebar-nav a:hover {
            background: rgba(255,255,255,0.08);
            color: #fff;
        }
        .sidebar-nav a.active {
            background: rgba(255,255,255,0.15);
            border-left-color: #d4a574;
            color: #fff;
            font-weight: 600;
        }
        .main-content {
            flex: 1;
            margin-left: 250px;
            display: flex;
            flex-direction: column;
        }
        .topbar {
            background: #fff;
            padding: 16px 32px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #e8dcc8;
        }
        .topbar h2 { font-size: 18px; font-weight: 600; color: #5c3d2e; }
        .topbar-info { font-size: 13px; color: #8b7355; }
        .content-wrapper { padding: 28px 32px; flex: 1; }
        .card {
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(107, 68, 35, 0.06);
            margin-bottom: 24px;
            border: 1px solid #ebe0d0;
            overflow: hidden;
        }
        .card-header {
            padding: 18px 24px;
            border-bottom: 1px solid #f0e6d6;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-title { font-size: 16px; font-weight: 600; color: #5c3d2e; }
        .card-body { padding: 24px; }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }
        .stat-card {
            padding: 20px;
            border-radius: 8px;
            background: linear-gradient(135deg, #fff9f0 0%, #fff 100%);
            border: 1px solid #f0e0cc;
        }
        .stat-label { font-size: 13px; color: #8b7355; margin-bottom: 6px; }
        .stat-value { font-size: 26px; font-weight: 700; color: #5c3d2e; }
        .stat-card.warning { background: linear-gradient(135deg, #fef3c7 0%, #fff 100%); border-color: #fde68a; }
        .stat-card.danger { background: linear-gradient(135deg, #fee2e2 0%, #fff 100%); border-color: #fecaca; }
        .stat-card.success { background: linear-gradient(135deg, #dcfce7 0%, #fff 100%); border-color: #bbf7d0; }
        .stat-card.info { background: linear-gradient(135deg, #dbeafe 0%, #fff 100%); border-color: #bfdbfe; }
        .btn {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary { background: #8b5a2b; color: #fff; }
        .btn-primary:hover { background: #6b4423; }
        .btn-secondary { background: #f5ebe0; color: #5c3d2e; border: 1px solid #d4c4a8; }
        .btn-secondary:hover { background: #ebe0d0; }
        .btn-danger { background: #dc2626; color: #fff; }
        .btn-danger:hover { background: #b91c1c; }
        .btn-sm { padding: 6px 12px; font-size: 13px; }
        .btn-group { display: flex; gap: 8px; }
        table { width: 100%; border-collapse: collapse; }
        th {
            text-align: left;
            padding: 12px 16px;
            background: #faf6f0;
            font-size: 13px;
            font-weight: 600;
            color: #5c3d2e;
            border-bottom: 2px solid #ebe0d0;
        }
        td {
            padding: 12px 16px;
            border-bottom: 1px solid #f5ede0;
            font-size: 14px;
            color: #44403a;
        }
        tr:hover td { background: #fdfaf5; }
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid;
        }
        .badge-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .badge-warning { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .badge-success { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
        .badge-info { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
        .badge-gray { background: #f3f4f6; color: #374151; border-color: #e5e7eb; }
        .form-group { margin-bottom: 18px; }
        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            color: #5c3d2e;
            margin-bottom: 6px;
        }
        .form-label .required { color: #dc2626; margin-left: 2px; }
        .form-input {
            width: 100%;
            padding: 9px 12px;
            border: 1px solid #d4c4a8;
            border-radius: 6px;
            font-size: 14px;
            color: #2d2a24;
            background: #fff;
            transition: all 0.2s;
        }
        .form-input:focus {
            outline: none;
            border-color: #8b5a2b;
            box-shadow: 0 0 0 3px rgba(139, 90, 43, 0.1);
        }
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
        }
        .alert {
            padding: 14px 18px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
            border: 1px solid;
        }
        .alert-success { background: #dcfce7; color: #166534; border-color: #bbf7d0; }
        .alert-danger { background: #fee2e2; color: #991b1b; border-color: #fecaca; }
        .alert-warning { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .alert-info { background: #dbeafe; color: #1e40af; border-color: #bfdbfe; }
        .pagination {
            display: flex;
            justify-content: center;
            gap: 6px;
            margin-top: 20px;
            padding: 16px 0;
        }
        .pagination a, .pagination span {
            padding: 7px 12px;
            border-radius: 6px;
            font-size: 13px;
            border: 1px solid #d4c4a8;
            color: #5c3d2e;
            text-decoration: none;
            background: #fff;
        }
        .pagination .active {
            background: #8b5a2b;
            color: #fff;
            border-color: #8b5a2b;
        }
        .pagination .disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .anomaly-section { margin-top: 12px;
            padding: 16px;
            border-radius: 6px;
            background: #fffbeb;
            border: 1px solid #fde68a;
        }
        .anomaly-item {
            padding: 10px 12px;
            margin-bottom: 8px;
            border-radius: 6px;
            background: #fff;
            border-left: 3px solid;
        }
        .anomaly-item:last-child { margin-bottom: 0; }
        .anomaly-high { border-left-color: #dc2626; }
        .anomaly-medium { border-left-color: #f59e0b; }
        .anomaly-low { border-left-color: #eab308; }
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 0;
        }
        .detail-item {
            padding: 14px 18px;
            border-bottom: 1px solid #f5ede0;
        }
        .detail-label {
            font-size: 12px;
            color: #8b7355;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 15px;
            font-weight: 600;
            color: #2d2a24;
        }
        .detail-value.anomaly { color: #dc2626; }
        .tabs {
            display: flex;
            gap: 4px;
            border-bottom: 2px solid #ebe0d0;
            margin-bottom: 20px;
        }
        .tab {
            padding: 10px 18px;
            font-size: 14px;
            color: #8b7355;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            text-decoration: none;
            display: inline-block;
        }
        .tab.active {
            color: #8b5a2b;
            border-bottom-color: #8b5a2b;
            font-weight: 600;
        }
        .tab:hover { color: #5c3d2e; }
        .filter-form {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            align-items: end;
        }
        .text-sm { font-size: 13px;
        }
        .text-xs { font-size: 12px; }
        .text-muted { color: #8b7355; }
        .text-danger { color: #dc2626; }
        .text-success { color: #166534; }
        .fw-bold { font-weight: 600; }
        .mb-0 { margin-bottom: 0; }
        .mt-4 { margin-top: 16px; }
        .mt-2 { margin-top: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .flex { display: flex; }
        .flex-between { display: flex; justify-content: space-between; align-items: center; }
        .gap-2 { gap: 8px; }
        .gap-3 { gap: 12px; }
        .w-full { width: 100%; }
        .code-block {
            font-family: 'Courier New', monospace;
            background: #f8f5f0;
            padding: 12px 16px;
            border-radius: 6px;
            border: 1px solid #ebe0d0;
            font-size: 12px;
            color: #5c3d2e;
            word-break: break-all;
        }
        .version-diff-old {
            background: #fee2e2;
            text-decoration: line-through;
            padding: 2px 6px;
            border-radius: 4px;
        }
        .version-diff-new {
            background: #dcfce7;
            padding: 2px 6px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <aside class="sidebar">
            <div class="sidebar-logo">
                <h1>🏺 传统榨油坊</h1>
                <p>批次压榨记录系统</p>
            </div>
            <nav class="sidebar-nav">
                <a href="{{ route('dashboard') }}" class="{{ request()->routeIs('dashboard') ? 'active' : '' }}">
                    📊 工作台
                </a>
                <a href="{{ route('batches.index') }}" class="{{ request()->routeIs('batches.*') && !request()->routeIs('batches.create') ? 'active' : '' }}">
                    📋 批次台账
                </a>
                <a href="{{ route('batches.create') }}" class="{{ request()->routeIs('batches.create') ? 'active' : '' }}">
                    ➕ 新建记录
                </a>
                <a href="{{ route('exports.summary.excel') }}">
                    📥 导出汇总
                </a>
            </nav>
        </aside>
        <div class="main-content">
            <header class="topbar">
                <h2>@yield('page-title', '传统榨油坊批次压榨记录系统')</h2>
                <div class="topbar-info">{{ now()->format('Y年m月d日 H:i') }}</div>
            </header>
            <main class="content-wrapper">
                @if(session('success'))
                    <div class="alert alert-success">{{ session('success') }}</div>
                @endif
                @if($errors->any())
                    <div class="alert alert-danger">
                        @foreach($errors->all() as $error)
                            <div>{{ $error }}</div>
                        @endforeach
                    </div>
                @endif
                @yield('content')
            </main>
        </div>
    </div>
</body>
</html>
