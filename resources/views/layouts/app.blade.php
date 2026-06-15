<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', '传统鼓皮张力调校工具')</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'drum': {
                            50: '#fdf8f6',
                            100: '#f2e8e5',
                            200: '#eaddd7',
                            300: '#e0cec7',
                            400: '#d2bab0',
                            500: '#bfa094',
                            600: '#a18072',
                            700: '#977669',
                            800: '#846358',
                            900: '#43302b',
                        }
                    }
                }
            }
        }
    </script>
    <style>
        .gradient-bg {
            background: linear-gradient(135deg, #43302b 0%, #846358 50%, #bfa094 100%);
        }
        .drum-card {
            background: linear-gradient(145deg, #ffffff 0%, #f7f5f3 100%);
            border: 1px solid #e0cec7;
        }
        .section-title {
            position: relative;
            padding-left: 1rem;
        }
        .section-title::before {
            content: '';
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 1.25rem;
            background: linear-gradient(180deg, #846358 0%, #bfa094 100%);
            border-radius: 2px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.625rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .badge-success {
            background-color: #d1fae5;
            color: #065f46;
        }
        .badge-warning {
            background-color: #fef3c7;
            color: #92400e;
        }
        .badge-danger {
            background-color: #fee2e2;
            color: #991b1b;
        }
        .badge-info {
            background-color: #dbeafe;
            color: #1e40af;
        }
        .badge-secondary {
            background-color: #e5e7eb;
            color: #374151;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <nav class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-12h-2v4H7v2h4v4h2v-4h4v-2h-4V8z"/>
                        </svg>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold">传统鼓皮张力调校工具</h1>
                        <p class="text-xs text-white/70">Drumhead Tension Tuning System</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="{{ route('drum-tuning.index') }}" 
                       class="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition {{ request()->is('drum-tuning*') ? 'bg-white/20' : '' }}">
                        调校记录
                    </a>
                    <a href="{{ route('comparison.index') }}" 
                       class="px-3 py-2 rounded-md text-sm font-medium hover:bg-white/10 transition {{ request()->is('comparisons*') ? 'bg-white/20' : '' }}">
                        方案比较
                    </a>
                    <a href="{{ route('drum-tuning.create') }}" 
                       class="px-4 py-2 bg-white text-drum-800 rounded-md text-sm font-medium hover:bg-drum-50 transition shadow">
                        + 新建记录
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        @if(session('success'))
            <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error'))
            <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {{ session('error') }}
            </div>
        @endif

        @yield('content')
    </main>

    <footer class="mt-12 py-6 bg-drum-900 text-white/60 text-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p>传统鼓皮张力调校工具 · 专业版 v1.0</p>
            <p class="mt-1">为传统民族鼓乐师打造的专业调校辅助系统</p>
        </div>
    </footer>

    @yield('scripts')
</body>
</html>
