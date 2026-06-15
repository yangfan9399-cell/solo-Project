<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', '钟乳洞声波测距探险游戏')</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            color: #e0e0e0;
            min-height: 100vh;
        }
        .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header {
            background: rgba(0,0,0,0.4);
            padding: 15px 25px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid rgba(100, 200, 255, 0.2);
        }
        .header h1 {
            font-size: 24px;
            background: linear-gradient(90deg, #4facfe, #00f2fe);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header .subtitle { color: #8892b0; font-size: 13px; margin-top: 4px; }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            text-decoration: none;
            color: #fff;
        }
        .btn-primary { background: linear-gradient(135deg, #4facfe, #00f2fe); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(79, 172, 254, 0.4); }
        .btn-danger { background: linear-gradient(135deg, #f5576c, #f093fb); }
        .btn-danger:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245, 87, 108, 0.4); }
        .btn-warning { background: linear-gradient(135deg, #fa709a, #fee140); color: #333; }
        .btn-warning:hover { transform: translateY(-2px); }
        .btn-secondary { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }
        .btn-secondary:hover { background: rgba(255,255,255,0.2); }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .card {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(100, 200, 255, 0.15);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .card-title {
            font-size: 16px;
            color: #4facfe;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(79, 172, 254, 0.3);
        }
        .grid { display: grid; gap: 20px; }
        .grid-2 { grid-template-columns: 1fr 1fr; }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
        .stat-box {
            background: rgba(79, 172, 254, 0.1);
            border: 1px solid rgba(79, 172, 254, 0.3);
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        .stat-value { font-size: 28px; font-weight: bold; color: #4facfe; }
        .stat-label { font-size: 12px; color: #8892b0; margin-top: 4px; }
        .progress-bar {
            height: 8px;
            background: rgba(255,255,255,0.1);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 8px;
        }
        .progress-fill {
            height: 100%;
            border-radius: 4px;
            transition: width 0.3s;
        }
        .progress-oxygen { background: linear-gradient(90deg, #00f2fe, #4facfe); }
        .progress-durability { background: linear-gradient(90deg, #fa709a, #fee140); }
        .progress-score { background: linear-gradient(90deg, #f5576c, #f093fb); }
        .table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .table th { color: #4facfe; font-weight: 500; }
        .table tr:hover { background: rgba(79, 172, 254, 0.05); }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 500;
        }
        .badge-success { background: rgba(0, 230, 118, 0.2); color: #00e676; }
        .badge-warning { background: rgba(255, 193, 7, 0.2); color: #ffc107; }
        .badge-danger { background: rgba(245, 87, 108, 0.2); color: #f5576c; }
        .badge-info { background: rgba(79, 172, 254, 0.2); color: #4facfe; }
        .badge-secondary { background: rgba(255,255,255,0.1); color: #8892b0; }
        .form-group { margin-bottom: 15px; }
        .form-label { display: block; font-size: 13px; color: #8892b0; margin-bottom: 6px; }
        .form-input, .form-select {
            width: 100%;
            padding: 10px 12px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.15);
            border-radius: 8px;
            color: #e0e0e0;
            font-size: 14px;
            outline: none;
            transition: border 0.2s;
        }
        .form-input:focus, .form-select:focus { border-color: #4facfe; }
        .form-range { width: 100%; }
        .log-entry {
            padding: 10px 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            font-size: 13px;
            background: rgba(255,255,255,0.03);
            border-left: 3px solid #4facfe;
        }
        .log-entry.system { border-left-color: #8892b0; }
        .log-entry.probe { border-left-color: #4facfe; }
        .log-entry.move { border-left-color: #00e676; }
        .log-entry.warning { border-left-color: #ffc107; background: rgba(255, 193, 7, 0.05); }
        .log-entry.error { border-left-color: #f5576c; background: rgba(245, 87, 108, 0.05); }
        .log-entry.success { border-left-color: #00e676; background: rgba(0, 230, 118, 0.05); }
        .log-title { font-weight: 500; color: #e0e0e0; }
        .log-message { color: #8892b0; margin-top: 3px; font-size: 12px; }
        .log-meta { color: #555; font-size: 11px; margin-top: 4px; }
        .cave-map {
            display: inline-block;
            background: #0a0a15;
            border-radius: 8px;
            padding: 10px;
            overflow: auto;
            max-width: 100%;
        }
        .map-row { display: flex; }
        .map-cell {
            width: 14px;
            height: 14px;
            border: 1px solid rgba(255,255,255,0.03);
            position: relative;
        }
        .cell-unknown { background: #151520; }
        .cell-path { background: #1a2a3a; }
        .cell-path.player {
            background: #00f2fe;
            box-shadow: 0 0 8px #00f2fe;
            border-radius: 3px;
        }
        .cell-path.exit {
            background: #00e676;
            box-shadow: 0 0 8px #00e676;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .cell-normal { background: #4a4a5a; }
        .cell-wet { background: #1e5f7a; }
        .cell-crack { background: #6b4a1e; }
        .cell-collapse { background: #5a1e1e; }
        .cell-conf-low { opacity: 0.5; }
        .cell-conf-med { opacity: 0.75; }
        .cell-conf-high { opacity: 1; }
        .cell-launch {
            box-shadow: 0 0 0 2px #ff9800, 0 0 10px rgba(255, 152, 0, 0.8) !important;
            border-radius: 3px;
            z-index: 2;
        }
        .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; font-size: 12px; }
        .legend-item { display: flex; align-items: center; gap: 6px; }
        .legend-color { width: 16px; height: 16px; border-radius: 3px; }
        canvas { max-width: 100%; }
        .flex { display: flex; }
        .flex-between { justify-content: space-between; }
        .flex-center { justify-content: center; align-items: center; }
        .gap-10 { gap: 10px; }
        .gap-20 { gap: 20px; }
        .mb-10 { margin-bottom: 10px; }
        .mb-20 { margin-bottom: 20px; }
        .mt-10 { margin-top: 10px; }
        .mt-20 { margin-top: 20px; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-muted { color: #8892b0; }
        .text-danger { color: #f5576c; }
        .text-success { color: #00e676; }
        .text-warning { color: #ffc107; }
        .text-info { color: #4facfe; }
        .hidden { display: none !important; }
        .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 13px;
        }
        .alert-info { background: rgba(79, 172, 254, 0.1); border: 1px solid rgba(79, 172, 254, 0.3); color: #4facfe; }
        .alert-warning { background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); color: #ffc107; }
        .alert-danger { background: rgba(245, 87, 108, 0.1); border: 1px solid rgba(245, 87, 108, 0.3); color: #f5576c; }
        .alert-success { background: rgba(0, 230, 118, 0.1); border: 1px solid rgba(0, 230, 118, 0.3); color: #00e676; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header flex flex-between">
            <div>
                <h1>🕳️ 钟乳洞声波测距探险游戏</h1>
                <div class="subtitle">通过声波回声推断洞穴结构，选择发射点、频率和探测方向来拼接洞穴轮廓</div>
            </div>
            <div>
                <a href="{{ route('game.index') }}" class="btn btn-secondary btn-sm">🏠 游戏大厅</a>
            </div>
        </div>
        @yield('content')
    </div>
    <script>
        const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        async function api(url, method = 'GET', data = null) {
            const options = {
                method,
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            };
            if (data) options.body = JSON.stringify(data);
            const res = await fetch(url, options);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || '请求失败');
            return json;
        }
    </script>
    @yield('scripts')
</body>
</html>
