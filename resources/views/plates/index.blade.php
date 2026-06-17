@extends('layouts.app')
@section('title', '项目台账 - 烫金版管理工具')

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">烫金版项目台账</div>
        <div class="page-subtitle">
            共检索到 <span class="fw-bold text-gold">{{ $plates->total() }}</span> 条记录
            @if($request->except('page', 'per_page'))
                · 已应用筛选条件
                <a href="{{ route('plates.index') }}" class="text-danger">(清除筛选)</a>
            @endif
        </div>
    </div>
    <div class="d-flex gap-8 items-center flex-wrap">
        <a href="{{ route('plates.export', $request->all()) }}" class="btn btn-secondary">📥 导出当前结果</a>
        <a href="{{ route('plates.create') }}" class="btn btn-primary">➕ 新增烫金版</a>
    </div>
</div>

<div class="filter-bar">
    <form method="GET" action="{{ route('plates.index') }}">
        <div class="filter-grid">
            <div>
                <label class="form-label">🔍 关键词检索</label>
                <input type="text" name="search" class="form-control" placeholder="版号/图案/书名/位置" value="{{ $request->search }}">
            </div>
            <div>
                <label class="form-label">📚 适用书名</label>
                <input type="text" name="book" class="form-control" placeholder="搜索书名关键字" value="{{ $request->book }}">
            </div>
            <div>
                <label class="form-label">📌 状态筛选</label>
                <select name="status" class="form-select">
                    <option value="">全部状态</option>
                    <option value="active" {{ $request->status === 'active' ? 'selected' : '' }}>正常在用</option>
                    <option value="warning" {{ $request->status === 'warning' ? 'selected' : '' }}>⚠ 异常待处理</option>
                    @foreach($statuses as $st)
                        <option value="{{ $st }}" {{ $request->status === $st ? 'selected' : '' }}>{{ $st }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label">⚙️ 材质类型</label>
                <select name="material" class="form-select">
                    <option value="">全部材质</option>
                    @foreach($materials as $m)
                        <option value="{{ $m }}" {{ $request->material === $m ? 'selected' : '' }}>{{ $m }}</option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="form-label">📊 使用率区间</label>
                <select name="usage_filter" class="form-select">
                    <option value="">不限</option>
                    <option value="high" {{ $request->usage_filter === 'high' ? 'selected' : '' }}>高 (≥ 85%)</option>
                    <option value="medium" {{ $request->usage_filter === 'medium' ? 'selected' : '' }}>中 (50-85%)</option>
                    <option value="low" {{ $request->usage_filter === 'low' ? 'selected' : '' }}>低 (< 50%)</option>
                </select>
            </div>
            <div>
                <label class="form-label">📐 宽度范围 (mm)</label>
                <div class="d-flex gap-8">
                    <input type="number" name="min_width" class="form-control" placeholder="最小" value="{{ $request->min_width }}" step="0.1">
                    <input type="number" name="max_width" class="form-control" placeholder="最大" value="{{ $request->max_width }}" step="0.1">
                </div>
            </div>
            <div>
                <label class="form-label">📄 每页显示</label>
                <select name="per_page" class="form-select">
                    <option value="10" {{ $request->per_page == 10 ? 'selected' : '' }}>10条</option>
                    <option value="15" {{ !$request->per_page || $request->per_page == 15 ? 'selected' : '' }}>15条</option>
                    <option value="30" {{ $request->per_page == 30 ? 'selected' : '' }}>30条</option>
                    <option value="50" {{ $request->per_page == 50 ? 'selected' : '' }}>50条</option>
                </select>
            </div>
            <div class="filter-actions">
                <button type="submit" class="btn btn-primary">🔎 应用筛选</button>
                <a href="{{ route('plates.index') }}" class="btn btn-secondary">重置</a>
            </div>
        </div>
    </form>
</div>

<div class="d-flex gap-8 mb-16 flex-wrap">
    @php
        $quickLinks = [
            ['全部记录', [], $plates->total()],
            ['⚠ 异常项', ['status' => 'warning'], $warningCount = \App\Models\Plate::warning()->count()],
            ['正常在用', ['status' => 'active'], \App\Models\Plate::active()->count()],
            ['待保养', ['status' => '待保养'], \App\Models\Plate::where('status','待保养')->count()],
            ['维修中', ['status' => '维修中'], \App\Models\Plate::where('status','维修中')->count()],
            ['已报废', ['status' => '已报废'], \App\Models\Plate::where('status','已报废')->count()],
        ];
    @endphp
    @foreach($quickLinks as $link)
        <a href="{{ route('plates.index', $link[1]) }}"
           class="badge {{ $request->status == ($link[1]['status'] ?? '') || (!$request->status && !$link[1]) ? 'badge-gold' : 'badge-secondary' }}"
           style="font-size:12px; padding:6px 14px;">
            {{ $link[0] }} · {{ $link[2] }}
        </a>
    @endforeach
</div>

<div class="card">
    <div class="table-wrap">
        <table class="table">
            <thead>
                <tr>
                    @php
                        $sortDir = $request->dir === 'asc' ? 'desc' : 'asc';
                        $sortIcon = fn($col) => $request->sort === $col ? ($request->dir === 'asc' ? '↑' : '↓') : '';
                    @endphp
                    <th><a href="{{ route('plates.index', array_merge($request->all(), ['sort' => 'plate_code', 'dir' => $sortDir])) }}" style="color:inherit;">版号 {!! $sortIcon('plate_code') !!}</a></th>
                    <th>图案名称 / 描述</th>
                    <th>铜版尺寸</th>
                    <th>材质</th>
                    <th><a href="{{ route('plates.index', array_merge($request->all(), ['sort' => 'usage_count', 'dir' => $sortDir])) }}" style="color:inherit;">使用率 {!! $sortIcon('usage_count') !!}</a></th>
                    <th>状态</th>
                    <th>存放位置</th>
                    <th><a href="{{ route('plates.index', array_merge($request->all(), ['sort' => 'next_maintenance_date', 'dir' => $sortDir])) }}" style="color:inherit;">下次保养 {!! $sortIcon('next_maintenance_date') !!}</a></th>
                    <th style="width:90px;">关联</th>
                    <th><a href="{{ route('plates.index', array_merge($request->all(), ['sort' => 'updated_at', 'dir' => $sortDir])) }}" style="color:inherit;">更新 {!! $sortIcon('updated_at') !!}</a></th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                @forelse($plates as $plate)
                @php
                    $rowClass = '';
                    if ($plate->status === '已报废') $rowClass = '';
                    elseif ($plate->is_warning) $rowClass = 'warning-row';
                @endphp
                <tr class="{{ $rowClass }}">
                    <td>
                        <a href="{{ route('plates.show', $plate) }}" class="fw-bold">
                            <span class="badge badge-gold" style="font-size:11px;">{{ $plate->plate_code }}</span>
                        </a>
                        @if($plate->is_high_usage && $plate->status !== '已报废')
                            <span class="badge badge-warning" style="margin-left:4px; font-size:10px;">🔥高</span>
                        @endif
                        @if($plate->is_overdue_maintenance && $plate->status !== '已报废')
                            <span class="badge badge-danger" style="margin-left:4px; font-size:10px;">⏰逾期</span>
                        @endif
                    </td>
                    <td style="min-width:200px;">
                        <div class="fw-bold mb-4">{{ $plate->pattern_name }}</div>
                        <div class="text-sm text-muted" style="display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                            {{ $plate->pattern_description ?: '—' }}
                        </div>
                        <div class="tag-list mt-8" style="margin-top:4px;">
                            @foreach(array_slice($plate->applicable_books_array, 0, 2) as $book)
                                <span class="tag" style="font-size:10px;">{{ \Illuminate\Support\Str::limit($book, 10) }}</span>
                            @endforeach
                            @if(count($plate->applicable_books_array) > 2)
                                <span class="text-muted text-sm">+{{ count($plate->applicable_books_array) - 2 }}</span>
                            @endif
                        </div>
                    </td>
                    <td class="nowrap">
                        <div class="fw-bold">{{ $plate->plate_width }} × {{ $plate->plate_height }}</div>
                        <div class="text-sm text-muted">厚 {{ $plate->plate_thickness }} mm</div>
                    </td>
                    <td>{{ $plate->material }}</td>
                    <td style="min-width:140px;">
                        <div class="d-flex justify-between text-sm mb-4">
                            <span class="fw-bold">{{ number_format($plate->usage_count) }}</span>
                            <span class="text-muted">/ {{ number_format($plate->max_usage) }}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill {{ $plate->usage_rate >= 100 ? 'danger' : ($plate->usage_rate >= 85 ? 'warn' : 'normal') }}"
                                 style="width: {{ min(100, $plate->usage_rate) }}%"></div>
                        </div>
                        <div class="text-sm mt-4">
                            <span class="{{ $plate->usage_rate >= 100 ? 'text-danger fw-bold' : ($plate->usage_rate >= 85 ? 'text-warning fw-bold' : '') }}">
                                {{ $plate->usage_rate }}%
                            </span>
                            @if($plate->usage_count > $plate->max_usage)
                                <span class="text-danger text-sm">超 {{ $plate->usage_count - $plate->max_usage }}次</span>
                            @endif
                        </div>
                    </td>
                    <td>
                        @php
                            $stClass = match($plate->status) {
                                '正常' => 'badge-success',
                                '待保养' => 'badge-warning',
                                '维修中' => 'badge-info',
                                '已报废' => 'badge-secondary',
                                default => 'badge-secondary',
                            };
                        @endphp
                        <span class="badge {{ $stClass }}">{{ $plate->status }}</span>
                    </td>
                    <td>{{ $plate->location ?: '—' }}</td>
                    <td class="nowrap">
                        @if($plate->next_maintenance_date && $plate->status !== '已报废')
                            <div class="fw-bold {{ $plate->is_overdue_maintenance ? 'text-danger' : '' }}">
                                {{ $plate->next_maintenance_date->format('Y-m-d') }}
                            </div>
                            <div class="text-sm text-muted">
                                @if($plate->maintenance_days_left < 0)
                                    逾期 {{ abs($plate->maintenance_days_left) }} 天
                                @elseif($plate->maintenance_days_left == 0)
                                    今日到期
                                @elseif($plate->maintenance_days_left <= 7)
                                    <span class="text-warning">{{ $plate->maintenance_days_left }} 天后</span>
                                @else
                                    {{ $plate->maintenance_days_left }} 天后
                                @endif
                            </div>
                        @else
                            <span class="text-muted">未设定</span>
                        @endif
                    </td>
                    <td>
                        <div class="text-sm">📋 {{ $plate->orders_count }} 单</div>
                        <div class="text-sm">🔄 {{ $plate->version_histories_count }} 版</div>
                    </td>
                    <td class="text-sm text-muted nowrap">
                        @if($plate->updated_at)
                            {{ $plate->updated_at->format('Y-m-d') }}
                        @endif
                    </td>
                    <td>
                        <div class="actions-row">
                            <a href="{{ route('plates.show', $plate) }}" class="btn btn-sm btn-secondary">详情</a>
                            <a href="{{ route('plates.edit', $plate) }}" class="btn btn-sm btn-secondary">编辑</a>
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="11">
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <div>没有找到符合条件的烫金版记录</div>
                            <a href="{{ route('plates.index') }}" class="btn btn-secondary mt-12">清除筛选条件</a>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    @if($plates->hasPages())
    <div class="card-footer">
        <div class="pagination">
            <div class="pagination-info">
                显示第 {{ $plates->firstItem() }} - {{ $plates->lastItem() }} 条，共 {{ $plates->total() }} 条记录
            </div>
            <div class="pagination-links">
                @if($plates->onFirstPage())
                    <span class="page-link" style="opacity:0.5;">首页</span>
                    <span class="page-link" style="opacity:0.5;">上一页</span>
                @else
                    <a class="page-link" href="{{ $plates->url(1) }}">首页</a>
                    <a class="page-link" href="{{ $plates->previousPageUrl() }}">上一页</a>
                @endif

                @foreach(range(1, $plates->lastPage()) as $p)
                    @if($p == 1 || $p == $plates->lastPage() || abs($p - $plates->currentPage()) <= 2)
                        <a class="page-link {{ $p == $plates->currentPage() ? 'active' : '' }}" href="{{ $plates->url($p) }}">{{ $p }}</a>
                    @elseif($p == 2 || $p == $plates->lastPage() - 1)
                        <span class="page-link" style="border:none;">...</span>
                    @endif
                @endforeach

                @if($plates->hasMorePages())
                    <a class="page-link" href="{{ $plates->nextPageUrl() }}">下一页</a>
                    <a class="page-link" href="{{ $plates->url($plates->lastPage()) }}">末页</a>
                @else
                    <span class="page-link" style="opacity:0.5;">下一页</span>
                    <span class="page-link" style="opacity:0.5;">末页</span>
                @endif
            </div>
        </div>
    </div>
    @endif
</div>
@endsection
