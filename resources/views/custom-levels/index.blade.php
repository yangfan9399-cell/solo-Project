@extends('layouts.app')

@section('title', '我的自定义谜题')

@section('content')
<div class="flex justify-between items-center mb-4">
    <h1 style="font-size: 1.75rem;">🎨 我的自定义谜题</h1>
    <a href="{{ route('custom-levels.create') }}" class="btn btn-primary">+ 创建新谜题</a>
</div>

<div class="card">
    @if($customLevels->count() > 0)
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(99,102,241,0.3);">
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">名称</th>
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">类型</th>
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">难度</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">基础分</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">创建时间</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">操作</th>
                </tr>
            </thead>
            <tbody>
                @foreach($customLevels as $level)
                    <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                        <td style="padding: 0.75rem;">
                            <div class="font-bold">{{ $level->name }}</div>
                            <div class="text-xs text-muted mt-1">{{ Str::limit($level->description, 50) }}</div>
                        </td>
                        <td style="padding: 0.75rem;">
                            <span class="badge badge-medium">{{ match($level->cipher_type) {
                                'caesar' => '凯撒',
                                'substitution' => '替换',
                                'vigenere' => '维吉尼亚',
                                'rotor' => '转轮',
                                default => $level->cipher_type,
                            } }}</span>
                        </td>
                        <td style="padding: 0.75rem;">
                            <span class="badge badge-{{ $level->difficulty }}">{{ $level->difficulty_label }}</span>
                        </td>
                        <td style="padding: 0.75rem; text-align: right;" class="font-bold text-warning">{{ $level->base_score }}</td>
                        <td style="padding: 0.75rem; text-align: right;" class="text-sm text-muted">{{ $level->created_at->format('Y-m-d') }}</td>
                        <td style="padding: 0.75rem; text-align: right;">
                            <div class="flex justify-end gap-2">
                                <a href="{{ route('custom-levels.show', $level) }}" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">预览</a>
                                <form method="POST" action="{{ route('game.start', $level) }}">
                                    @csrf
                                    <button type="submit" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">开始挑战</button>
                                </form>
                                <form method="POST" action="{{ route('custom-levels.destroy', $level) }}" onsubmit="return confirm('确定删除这个谜题吗？')">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">删除</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @endforeach
            </tbody>
        </table>
        <div class="mt-3">
            {{ $customLevels->links() }}
        </div>
    @else
        <div class="text-center py-8">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
            <p class="text-muted mb-3">你还没有创建任何自定义谜题</p>
            <a href="{{ route('custom-levels.create') }}" class="btn btn-primary">创建第一个谜题</a>
        </div>
    @endif
</div>
@endsection
