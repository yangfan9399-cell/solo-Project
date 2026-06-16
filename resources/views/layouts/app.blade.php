<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', '剧本杀线索编排主持工具')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .clue-card {
            cursor: grab;
            transition: all 0.2s ease;
        }
        .clue-card:active {
            cursor: grabbing;
        }
        .clue-card.dragging {
            opacity: 0.5;
            transform: scale(1.05);
        }
        .drop-zone {
            transition: all 0.2s ease;
        }
        .drop-zone.drag-over {
            background-color: rgba(59, 130, 246, 0.1);
            border-color: rgb(59, 130, 246);
            border-style: dashed;
        }
        .fade-in {
            animation: fadeIn 0.3s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .shake {
            animation: shake 0.5s ease;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
        }
    </style>
</head>
<body class="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen">
    <nav class="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-4">
                    <a href="{{ route('home') }}" class="text-2xl font-bold text-white flex items-center space-x-2">
                        <span>🎭</span>
                        <span>剧本杀主持工具</span>
                    </a>
                    <a href="{{ route('levels.index') }}" class="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                        🗂️ 关卡库
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    @if(session('player_id'))
                        <div class="flex items-center space-x-3">
                            <span class="text-3xl">{{ optional(\App\Models\Player::find(session('player_id')))->avatar }}</span>
                            <span class="text-white font-medium">{{ optional(\App\Models\Player::find(session('player_id')))->name }}</span>
                            <span class="text-yellow-400 text-sm">
                                总分: {{ optional(\App\Models\Player::find(session('player_id')))->total_score }}
                            </span>
                            <form action="{{ route('players.logout') }}" method="POST" class="inline">
                                @csrf
                                <button type="submit" class="text-gray-400 hover:text-white text-sm px-3 py-1 rounded border border-gray-600 hover:border-gray-400 transition">
                                    切换档案
                                </button>
                            </form>
                        </div>
                    @else
                        <a href="{{ route('players.index') }}" class="text-white bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium transition">
                            选择侦探档案
                        </a>
                    @endif
                </div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if(session('success'))
            <div class="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 fade-in">
                {{ session('success') }}
            </div>
        @endif
        @if(session('error'))
            <div class="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 fade-in">
                {{ session('error') }}
            </div>
        @endif
        @if(session('warning'))
            <div class="mb-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 fade-in">
                {{ session('warning') }}
            </div>
        @endif
        @if(session('info'))
            <div class="mb-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 fade-in">
                {{ session('info') }}
            </div>
        @endif

        @yield('content')
    </main>

    <footer class="mt-auto py-6 text-center text-gray-500 text-sm border-t border-white/5">
        <p>🔍 剧本杀线索编排主持工具游戏 - 找出真凶，还原真相</p>
    </footer>

    @yield('scripts')
</body>
</html>
