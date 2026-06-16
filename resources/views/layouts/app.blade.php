<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '图书修补胶水配比实验')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap');

        body {
            font-family: 'Noto Serif SC', serif;
            background: linear-gradient(135deg, #fdf6e3 0%, #f5e6d3 100%);
            min-height: 100vh;
        }

        .glue-beaker {
            position: relative;
            width: 120px;
            height: 160px;
            border: 3px solid #8b7355;
            border-radius: 0 0 20px 20px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.3);
        }

        .glue-liquid {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            transition: all 0.5s ease;
            border-radius: 0 0 17px 17px;
        }

        .material-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .material-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .star {
            color: #d4af37;
        }

        .star-empty {
            color: #d4cfc4;
        }

        .btn-primary {
            background: linear-gradient(135deg, #8b6914 0%, #d4a574 100%);
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }

        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(139, 105, 20, 0.4);
        }

        .btn-primary:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        .btn-secondary {
            background: white;
            color: #8b6914;
            padding: 10px 24px;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.3s ease;
            border: 2px solid #d4a574;
            cursor: pointer;
        }

        .btn-secondary:hover {
            background: #fdf6e3;
        }

        .progress-bar {
            height: 8px;
            border-radius: 4px;
            background: #e8dfd0;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            transition: width 0.5s ease;
            border-radius: 4px;
        }

        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            border: 1px solid #e8dfd0;
        }

        .level-card {
            transition: all 0.3s ease;
        }

        .level-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
        }

        .level-card.locked {
            opacity: 0.6;
            filter: grayscale(50%);
        }

        .level-card.locked:hover {
            transform: none;
        }

        .bubble {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            animation: rise 2s infinite ease-in;
        }

        @keyframes rise {
            0% {
                transform: translateY(0) scale(1);
                opacity: 0.8;
            }
            100% {
                transform: translateY(-60px) scale(0.5);
                opacity: 0;
            }
        }

        .shake {
            animation: shake 0.5s ease-in-out;
        }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }

        .success-glow {
            animation: successGlow 1s ease-in-out;
        }

        @keyframes successGlow {
            0%, 100% { box-shadow: 0 0 0 rgba(34, 197, 94, 0); }
            50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.5); }
        }

        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 50;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }

        .modal-content {
            background: white;
            border-radius: 16px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }

        .modal-overlay.active .modal-content {
            transform: scale(1);
        }

        .history-step {
            transition: all 0.2s ease;
        }

        .history-step:hover {
            background: #fdf6e3;
        }

        input[type="range"] {
            -webkit-appearance: none;
            height: 6px;
            border-radius: 3px;
            background: #e8dfd0;
        }

        input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #d4a574;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .amount-input {
            width: 60px;
            text-align: center;
            border: 1px solid #d4c4b0;
            border-radius: 4px;
            padding: 4px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <nav class="bg-gradient-to-r from-amber-900 to-amber-700 text-white shadow-lg">
        <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="{{ route('home') }}" class="text-xl font-bold flex items-center gap-2">
                <span class="text-2xl">📚</span>
                <span>胶水配比实验室</span>
            </a>
            <div class="flex items-center gap-4">
                @auth
                    <a href="{{ route('levels.index') }}" class="hover:text-amber-200 transition">关卡</a>
                    <a href="{{ route('recipes.index') }}" class="hover:text-amber-200 transition">配方库</a>
                    <span class="text-amber-200">|</span>
                    <span class="text-sm">
                        <span class="text-amber-200">玩家:</span>
                        <span class="font-semibold">{{ $user->name ?? auth()->user()->name }}</span>
                    </span>
                    <form method="POST" action="{{ route('logout') }}" class="inline">
                        @csrf
                        <button type="submit" class="text-sm hover:text-amber-200 transition">退出</button>
                    </form>
                @else
                    <a href="{{ route('login') }}" class="hover:text-amber-200 transition">登录</a>
                    <a href="{{ route('register') }}" class="hover:text-amber-200 transition">注册</a>
                    <a href="{{ route('quick-play') }}" class="btn-secondary !py-1 !px-3 !text-sm">快速开始</a>
                @endauth
            </div>
        </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 py-6">
        @if(session('success'))
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
                {{ session('error') }}
            </div>
        @endif

        @yield('content')
    </main>

    <footer class="text-center text-amber-800/60 py-6 text-sm">
        <p>📖 图书修补胶水配比实验游戏 - 成为最棒的图书修复师！</p>
    </footer>

    @yield('scripts')
</body>
</html>
