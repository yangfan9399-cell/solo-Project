<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '罕见乐器调音频谱训练工具')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js" defer></script>
    <style>
        [x-cloak] { display: none !important; }
        .anomaly-pulse { animation: pulse-red 2s infinite; }
        @keyframes pulse-red {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <nav class="bg-indigo-800 text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex items-center justify-between h-14">
                <a href="{{ route('dashboard') }}" class="font-bold text-lg tracking-wide">🎵 罕见乐器调音频谱训练工具</a>
                <div class="flex space-x-1 text-sm">
                    <a href="{{ route('dashboard') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('dashboard') ? 'bg-indigo-900' : '' }}">工作台</a>
                    <a href="{{ route('sessions.index') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('sessions.*') ? 'bg-indigo-900' : '' }}">调音台账</a>
                    <a href="{{ route('instruments.index') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('instruments.*') ? 'bg-indigo-900' : '' }}">乐器库</a>
                    <a href="{{ route('tone-libraries.index') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('tone-libraries.*') ? 'bg-indigo-900' : '' }}">目标音库</a>
                    <a href="{{ route('practice.index') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('practice.*') ? 'bg-indigo-900' : '' }}">练习记录</a>
                    <a href="{{ route('practice.chart') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('practice.chart') ? 'bg-indigo-900' : '' }}">练习曲线</a>
                    <a href="{{ route('export.index') }}" class="px-3 py-2 rounded hover:bg-indigo-700 {{ request()->routeIs('export.*') ? 'bg-indigo-900' : '' }}">导出</a>
                </div>
            </div>
        </div>
    </nav>

    @if(session('success'))
    <div class="max-w-7xl mx-auto px-4 mt-4">
        <div class="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded flex justify-between items-center">
            <span>{{ session('success') }}</span>
            <button onclick="this.parentElement.remove()" class="text-green-600 hover:text-green-800">&times;</button>
        </div>
    </div>
    @endif

    @if(session('error'))
    <div class="max-w-7xl mx-auto px-4 mt-4">
        <div class="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded flex justify-between items-center">
            <span>{{ session('error') }}</span>
            <button onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800">&times;</button>
        </div>
    </div>
    @endif

    <main class="max-w-7xl mx-auto px-4 py-6">
        @yield('content')
    </main>

    <footer class="text-center text-gray-400 text-xs py-6 mt-8 border-t">
        罕见乐器调音频谱训练工具 &copy; {{ date('Y') }}
    </footer>
</body>
</html>
