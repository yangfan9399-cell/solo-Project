<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '烫金版管理工具')</title>
    <style>
        :root {
            --primary: #B8860B;
            --primary-light: #DAA520;
            --primary-dark: #8B6914;
            --gold-gradient: linear-gradient(135deg, #F7E7A1 0%, #DAA520 50%, #B8860B 100%);
            --bg: #FDF8F0;
            --bg-card: #FFFFFF;
            --border: #E8DFC7;
            --text: #2C2416;
            --text-muted: #7A6F5C;
            --success: #15803d;
            --warning: #CA8A04;
            --danger: #B91C1C;
            --info: #1D4ED8;
            --shadow-sm: 0 1px 2px 0 rgba(139, 105, 20, 0.08);
            --shadow: 0 4px 12px 0 rgba(139, 105, 20, 0.1);
            --shadow-lg: 0 10px 25px -5px rgba(139, 105, 20, 0.15);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            font-size: 14px;
        }
        a { color: var(--primary); text-decoration: none; }
        a:hover { color: var(--primary-dark); }

        /* 顶部导航 */
        .navbar {
            background: linear-gradient(90deg, #3D2914 0%, #5C3D1F 100%);
            padding: 0 24px;
            box-shadow: var(--shadow-lg);
            position: sticky;
            top: 0;
            z-index: 50;
            border-bottom: 3px solid var(--primary-light);
        }
        .nav-inner {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            height: 64px;
            gap: 32px;
        }
        .nav-brand {
            display: flex;
            align-items: center;
            gap: 12px;
            color: #F7E7A1;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 1px;
        }
        .nav-brand-icon {
            width: 36px;
            height: 36px;
            background: var(--gold-gradient);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            box-shadow: 0 0 15px rgba(218, 165, 32, 0.5);
        }
        .nav-links { display: flex; gap: 4px; }
        .nav-link {
            padding: 8px 16px;
            color: #E8D7B0;
            border-radius: 6px;
            font-size: 14px;
            transition: all 0.2s;
        }
        .nav-link:hover, .nav-link.active {
            background: rgba(218, 165, 32, 0.2);
            color: var(--primary-light);
        }

        /* 主体区域 */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 24px;
        }
        .page-header {
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            flex-wrap: wrap;
            gap: 16px;
        }
        .page-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .page-title::before {
            content: '';
            width: 4px;
            height: 28px;
            background: var(--gold-gradient);
            border-radius: 2px;
        }
        .page-subtitle {
            color: var(--text-muted);
            margin-top: 6px;
            font-size: 13px;
        }

        /* 按钮 */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            line-height: 1.4;
            white-space: nowrap;
        }
        .btn-primary {
            background: var(--gold-gradient);
            color: #3D2914;
            box-shadow: var(--shadow-sm);
        }
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: var(--shadow);
            color: #3D2914;
        }
        .btn-secondary {
            background: #FFF;
            color: var(--text);
            border: 1px solid var(--border);
        }
        .btn-secondary:hover {
            background: var(--bg);
            border-color: var(--primary-light);
        }
        .btn-success { background: #16A34A; color: #FFF; }
        .btn-success:hover { background: #15803D; color: #FFF; }
        .btn-danger { background: #DC2626; color: #FFF; }
        .btn-danger:hover { background: #B91C1C; color: #FFF; }
        .btn-sm { padding: 5px 10px; font-size: 12px; }
        .btn-lg { padding: 10px 20px; font-size: 14px; }

        /* 卡片 */
        .card {
            background: var(--bg-card);
            border-radius: 10px;
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border);
            overflow: hidden;
        }
        .card-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(180deg, #FFFBF2 0%, #FFF 100%);
        }
        .card-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--text);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .card-body { padding: 20px; }
        .card-footer {
            padding: 12px 20px;
            border-top: 1px solid var(--border);
            background: #FFFBF2;
        }

        /* 统计卡片 */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .stat-card {
            background: #FFF;
            border-radius: 10px;
            padding: 18px 20px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            position: relative;
            overflow: hidden;
        }
        .stat-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 4px; height: 100%;
            background: var(--accent-color, var(--primary));
        }
        .stat-label {
            color: var(--text-muted);
            font-size: 12px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--text);
            line-height: 1.2;
        }
        .stat-value small { font-size: 14px; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
        .stat-foot { margin-top: 10px; font-size: 12px; color: var(--text-muted); }
        .stat-icon {
            position: absolute;
            right: 16px; top: 16px;
            width: 40px; height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            background: var(--accent-bg, rgba(218, 165, 32, 0.1));
            color: var(--accent-color, var(--primary));
        }

        /* 表格 */
        .table-wrap { overflow-x: auto; }
        .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }
        .table th {
            background: #FFFBF2;
            padding: 12px 14px;
            text-align: left;
            font-weight: 600;
            color: var(--text);
            border-bottom: 2px solid var(--border);
            white-space: nowrap;
            cursor: pointer;
        }
        .table th:hover { background: #FFF6DF; }
        .table td {
            padding: 10px 14px;
            border-bottom: 1px solid #F0E8D2;
            vertical-align: middle;
        }
        .table tbody tr:hover { background: #FFFBEF; }
        .table tbody tr.warning-row { background: #FFFBEB; }
        .table tbody tr.warning-row:hover { background: #FFF4D1; }
        .table tbody tr.danger-row { background: #FEF2F2; }
        .table tbody tr.retired-row { opacity: 0.55; }
        .table tbody tr.retired-row td { color: #9CA3AF; }

        /* 徽章/标签 */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 3px 10px;
            border-radius: 100px;
            font-size: 11px;
            font-weight: 500;
            line-height: 1.6;
            white-space: nowrap;
        }
        .badge-success { background: #DCFCE7; color: #166534; }
        .badge-warning { background: #FEF3C7; color: #92400E; }
        .badge-danger { background: #FEE2E2; color: #991B1B; }
        .badge-info { background: #DBEAFE; color: #1E40AF; }
        .badge-secondary { background: #F3F4F6; color: #374151; }
        .badge-gold { background: linear-gradient(135deg, #FEF3C7, #FDE68A); color: #78350F; border: 1px solid #FCD34D;}

        /* 状态进度条 */
        .progress-bar {
            height: 8px;
            background: #F0E8D2;
            border-radius: 4px;
            overflow: hidden;
            min-width: 80px;
        }
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s;
        }
        .progress-fill.normal { background: linear-gradient(90deg, #22C55E, #16A34A); }
        .progress-fill.warn { background: linear-gradient(90deg, #F59E0B, #D97706); }
        .progress-fill.danger { background: linear-gradient(90deg, #EF4444, #DC2626); }

        /* 表单 */
        .form-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 16px;
        }
        .form-group { margin-bottom: 16px; }
        .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            font-size: 13px;
            color: var(--text);
        }
        .form-label .required { color: var(--danger); margin-left: 2px; }
        .form-control, .form-select, .form-textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 13px;
            color: var(--text);
            background: #FFF;
            font-family: inherit;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-control:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: var(--primary-light);
            box-shadow: 0 0 0 3px rgba(218, 165, 32, 0.15);
        }
        .form-textarea { resize: vertical; min-height: 80px; }
        .form-hint { margin-top: 4px; font-size: 11px; color: var(--text-muted); }
        .form-error { margin-top: 4px; font-size: 11px; color: var(--danger); }
        .form-control.is-invalid, .form-select.is-invalid, .form-textarea.is-invalid {
            border-color: var(--danger);
            background: #FEF2F2;
        }
        .form-control.is-invalid:focus, .form-select.is-invalid:focus, .form-textarea.is-invalid:focus {
            border-color: var(--danger);
            box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
        }

        /* 筛选栏 */
        .filter-bar {
            background: #FFF;
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 20px;
            box-shadow: var(--shadow-sm);
        }
        .filter-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 12px;
            align-items: end;
        }
        .filter-actions {
            display: flex;
            gap: 8px;
            align-items: end;
            flex-wrap: wrap;
        }

        /* 详情网格 */
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }
        .detail-item {
            display: flex;
            gap: 12px;
        }
        .detail-label {
            min-width: 100px;
            color: var(--text-muted);
            font-size: 13px;
        }
        .detail-value {
            flex: 1;
            color: var(--text);
            font-size: 13px;
            word-break: break-word;
        }

        /* 时间线 */
        .timeline {
            position: relative;
            padding-left: 28px;
        }
        .timeline::before {
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(180deg, var(--primary-light), var(--border));
        }
        .timeline-item {
            position: relative;
            padding-bottom: 20px;
        }
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -23px;
            top: 5px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary-light);
            border: 2px solid #FFF;
            box-shadow: 0 0 0 2px var(--primary-light);
        }
        .timeline-date {
            font-size: 11px;
            color: var(--text-muted);
            margin-bottom: 4px;
        }
        .timeline-title {
            font-weight: 600;
            color: var(--text);
            font-size: 13px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .timeline-desc {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.7;
        }
        .timeline-meta {
            margin-top: 6px;
            display: flex;
            gap: 12px;
            font-size: 11px;
            color: var(--text-muted);
        }

        /* 标签列表 */
        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }
        .tag {
            padding: 3px 10px;
            background: #FFF6DF;
            color: #92400E;
            border-radius: 4px;
            font-size: 11px;
            border: 1px solid #FDE68A;
        }

        /* 提示框 */
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 16px;
            border-left: 4px solid;
            display: flex;
            gap: 10px;
            align-items: flex-start;
        }
        .alert-success { background: #F0FDF4; border-color: #22C55E; color: #14532D; }
        .alert-warning { background: #FFFBEB; border-color: #F59E0B; color: #78350F; }
        .alert-danger { background: #FEF2F2; border-color: #EF4444; color: #7F1D1D; }
        .alert-info { background: #EFF6FF; border-color: #3B82F6; color: #1E3A8A; }

        /* 网格布局 */
        .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
        @media (max-width: 900px) {
            .grid-2, .grid-3, .grid-2-1 { grid-template-columns: 1fr; }
        }

        /* 分页 */
        .pagination {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            flex-wrap: wrap;
            gap: 12px;
        }
        .pagination-info { color: var(--text-muted); font-size: 12px; }
        .pagination-links { display: flex; gap: 4px; }
        .page-link {
            padding: 6px 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: #FFF;
            color: var(--text);
            font-size: 12px;
        }
        .page-link.active {
            background: var(--gold-gradient);
            border-color: var(--primary-light);
            color: #3D2914;
            font-weight: 600;
        }
        .page-link:hover:not(.active) {
            border-color: var(--primary-light);
            color: var(--primary-dark);
        }

        /* Tabs */
        .tabs {
            display: flex;
            border-bottom: 2px solid var(--border);
            gap: 4px;
            margin-bottom: 20px;
        }
        .tab {
            padding: 10px 18px;
            color: var(--text-muted);
            font-weight: 500;
            font-size: 13px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s;
            background: none;
            border-top: none;
            border-left: none;
            border-right: none;
            font-family: inherit;
        }
        .tab:hover { color: var(--primary); }
        .tab.active {
            color: var(--primary-dark);
            border-bottom-color: var(--primary-light);
        }
        .tab-section { display: none; }
        .tab-section.active { display: block; }

        /* 模态框样式的面板 */
        .sub-panel {
            background: #FFFBF2;
            border: 1px dashed var(--border);
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
        }
        .sub-panel-title {
            font-weight: 600;
            font-size: 13px;
            margin-bottom: 12px;
            color: var(--primary-dark);
        }

        /* 工具类 */
        .text-muted { color: var(--text-muted); }
        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-danger { color: var(--danger); }
        .text-gold { color: var(--primary); }
        .fw-bold { font-weight: 600; }
        .d-flex { display: flex; }
        .gap-8 { gap: 8px; }
        .gap-12 { gap: 12px; }
        .gap-16 { gap: 16px; }
        .items-center { align-items: center; }
        .justify-between { justify-content: space-between; }
        .flex-wrap { flex-wrap: wrap; }
        .mb-0 { margin-bottom: 0; }
        .mb-8 { margin-bottom: 8px; }
        .mb-12 { margin-bottom: 12px; }
        .mb-16 { margin-bottom: 16px; }
        .mb-20 { margin-bottom: 20px; }
        .mb-24 { margin-bottom: 24px; }
        .mt-8 { margin-top: 8px; }
        .mt-12 { margin-top: 12px; }
        .text-sm { font-size: 12px; }
        .text-lg { font-size: 16px; }
        .text-xl { font-size: 18px; }
        .minw-100 { min-width: 100px; }
        .nowrap { white-space: nowrap; }

        /* 空状态 */
        .empty-state {
            padding: 48px 24px;
            text-align: center;
            color: var(--text-muted);
        }
        .empty-state-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }

        /* 动作菜单 */
        .actions-row {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="nav-inner">
            <a href="{{ route('dashboard') }}" class="nav-brand">
                <div class="nav-brand-icon">烫</div>
                <span>烫金版管理系统</span>
            </a>
            <div class="nav-links">
                <a href="{{ route('dashboard') }}" class="nav-link {{ request()->routeIs('dashboard') ? 'active' : '' }}">工作台</a>
                <a href="{{ route('plates.index') }}" class="nav-link {{ request()->routeIs('plates.index') ? 'active' : '' }}">项目台账</a>
                <a href="{{ route('plates.create') }}" class="nav-link {{ request()->routeIs('plates.create') ? 'active' : '' }}">新增烫金版</a>
                <a href="{{ route('plates.export') }}" class="nav-link">导出摘要</a>
            </div>
        </div>
    </nav>

    <main class="container">
        @if(session('success'))
            <div class="alert alert-success">
                <span>✓</span>
                <div>{{ session('success') }}</div>
            </div>
        @endif
        @if($errors->any())
            <div class="alert alert-danger">
                <span>⚠</span>
                <div>
                    @foreach($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            </div>
        @endif

        @yield('content')
    </main>

    <footer style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 12px; border-top: 1px solid var(--border); margin-top: 40px; background: #FFFBF2;">
        手工书封面烫金版管理工具 · 专业冷门行业工作台 · {{ now()->format('Y') }}
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.tabs').forEach(function(tabsEl) {
                const tabs = tabsEl.querySelectorAll('.tab');
                const sections = tabsEl.parentElement.querySelectorAll('.tab-section');
                tabs.forEach(function(tab) {
                    tab.addEventListener('click', function() {
                        tabs.forEach(t => t.classList.remove('active'));
                        sections.forEach(s => s.classList.remove('active'));
                        tab.classList.add('active');
                        const target = tab.dataset.target;
                        document.getElementById(target)?.classList.add('active');
                        history.replaceState(null, '', '#' + target);
                    });
                });
                if (location.hash) {
                    const targetTab = tabsEl.querySelector('[data-target="' + location.hash.slice(1) + '"]');
                    if (targetTab) targetTab.click();
                }
            });

            document.querySelectorAll('form[data-confirm]').forEach(function(form) {
                form.addEventListener('submit', function(e) {
                    const msg = form.dataset.confirm || '确定执行此操作？';
                    if (!confirm(msg)) e.preventDefault();
                });
            });
        });

        function togglePanel(id) {
            const el = document.getElementById(id);
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
        }
    </script>
</body>
</html>
