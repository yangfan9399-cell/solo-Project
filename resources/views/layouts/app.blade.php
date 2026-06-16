<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '地下档案馆索引修复')</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
            background: #1a1a2e;
            color: #e0e0e0;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 2px solid #4a4a6a;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2em;
            color: #d4af37;
            text-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        }
        .header p {
            color: #888;
            margin-top: 8px;
        }
        .card {
            background: #16213e;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
            border: 1px solid #2a2a4a;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .card h2 {
            color: #d4af37;
            margin-bottom: 16px;
            font-size: 1.3em;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #d4af37;
            color: #1a1a2e;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
        }
        .btn:hover {
            background: #e5c048;
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: #3a3a5a;
            color: #e0e0e0;
        }
        .btn-secondary:hover {
            background: #4a4a7a;
        }
        .btn-danger {
            background: #c94c4c;
            color: white;
        }
        .btn-danger:hover {
            background: #d95c5c;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        input[type="text"] {
            padding: 10px 14px;
            border: 1px solid #3a3a5a;
            border-radius: 6px;
            background: #0f3460;
            color: #e0e0e0;
            font-size: 14px;
            width: 100%;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #d4af37;
        }
        .player-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f3460;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .stats {
            display: flex;
            gap: 20px;
            font-size: 13px;
            color: #aaa;
        }
        .stats span {
            color: #d4af37;
            font-weight: 600;
        }
        .level-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }
        .level-card {
            background: #0f3460;
            border-radius: 8px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
            border: 1px solid transparent;
        }
        .level-card:hover {
            border-color: #d4af37;
            transform: translateY(-2px);
        }
        .level-card h3 {
            color: #d4af37;
            margin-bottom: 8px;
        }
        .level-card p {
            color: #aaa;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 12px;
        }
        .level-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #888;
        }
        .difficulty {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }
        .difficulty-1 { background: #10b981; color: #0f3460; }
        .difficulty-2 { background: #f59e0b; color: #1a1a2e; }
        .difficulty-3 { background: #ef4444; color: white; }
        .leaderboard {
            list-style: none;
        }
        .leaderboard li {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #2a2a4a;
        }
        .leaderboard li:last-child { border-bottom: none; }
        .leaderboard .rank {
            color: #d4af37;
            font-weight: 600;
            width: 30px;
        }
        .leaderboard .name { flex: 1; }
        .leaderboard .score { color: #10b981; font-weight: 600; }
        .hidden { display: none !important; }
        .row { display: flex; gap: 20px; }
        .col { flex: 1; }
        .col-sidebar { width: 320px; flex-shrink: 0; }
        @media (max-width: 900px) {
            .row { flex-direction: column; }
            .col-sidebar { width: 100%; }
        }
    </style>
    @yield('head')
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📜 地下档案馆</h1>
            <p>索引修复解谜游戏</p>
        </div>
        @yield('content')
    </div>
    @yield('scripts')
</body>
</html>
