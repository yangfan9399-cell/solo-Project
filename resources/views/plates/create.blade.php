@extends('layouts.app')
@section('title', '新增烫金版')

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">新增烫金版档案</div>
        <div class="page-subtitle">录入铜版尺寸、图案、适用书名等信息，系统将自动生成初始版本记录</div>
    </div>
    <a href="{{ route('plates.index') }}" class="btn btn-secondary">← 返回台账</a>
</div>

<form method="POST" action="{{ route('plates.store') }}">
    @csrf
    <div class="card mb-20">
        <div class="card-header">
            <div class="card-title">📋 基本信息</div>
        </div>
        <div class="card-body">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">版号编码<span class="required">*</span></label>
                    <input type="text" name="plate_code" class="form-control" placeholder="例：TG-2026-001" required
                           value="{{ old('plate_code', 'TG-' . date('Y') . '-' . str_pad(App\Models\Plate::count() + 1, 3, '0', STR_PAD_LEFT)) }}">
                    <div class="form-hint">推荐格式：TG-年份-流水号，需全站唯一</div>
                    @error('plate_code')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">图案名称<span class="required">*</span></label>
                    <input type="text" name="pattern_name" class="form-control" placeholder="例：古典云纹图案" required
                           value="{{ old('pattern_name') }}">
                    @error('pattern_name')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">材质<span class="required">*</span></label>
                    <select name="material" class="form-select" required>
                        @foreach($materials as $m)
                            <option value="{{ $m }}" {{ old('material') === $m ? 'selected' : '' }}>{{ $m }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">当前状态<span class="required">*</span></label>
                    <select name="status" class="form-select" required>
                        @foreach($statuses as $st)
                            <option value="{{ $st }}" {{ old('status') === $st ? 'selected' : '' }}>{{ $st }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">图案描述</label>
                <textarea name="pattern_description" class="form-textarea" rows="3"
                          placeholder="详细描述图案设计细节、风格、适用场景等">{{ old('pattern_description') }}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label">适用书名<span class="required">*</span></label>
                <textarea name="applicable_books" class="form-textarea" rows="3" required
                          placeholder="每行一本书名，或用逗号、顿号分隔。例：&#10;《红楼梦》精装版&#10;《西游记》收藏版">{{ old('applicable_books') }}</textarea>
                <div class="form-hint">支持多行、逗号、顿号分隔，系统将自动拆分为多个书名标签</div>
                @error('applicable_books')<div class="form-error">{{ $message }}</div>@enderror
            </div>
        </div>
    </div>

    <div class="card mb-20">
        <div class="card-header">
            <div class="card-title">📐 铜版规格</div>
        </div>
        <div class="card-body">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">宽度 (mm)<span class="required">*</span></label>
                    <input type="number" name="plate_width" class="form-control" step="0.01" min="1" required
                           value="{{ old('plate_width', 180) }}" placeholder="180.00">
                    @error('plate_width')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">高度 (mm)<span class="required">*</span></label>
                    <input type="number" name="plate_height" class="form-control" step="0.01" min="1" required
                           value="{{ old('plate_height', 240) }}" placeholder="240.00">
                    @error('plate_height')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">厚度 (mm)<span class="required">*</span></label>
                    <input type="number" name="plate_thickness" class="form-control" step="0.1" min="0.5" max="10" required
                           value="{{ old('plate_thickness', 1.5) }}" placeholder="1.5">
                    @error('plate_thickness')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">存放位置</label>
                    <input type="text" name="location" class="form-control" placeholder="例：A区-01-03" value="{{ old('location') }}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">制作日期</label>
                    <input type="date" name="manufacture_date" class="form-control" value="{{ old('manufacture_date', date('Y-m-d')) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">使用次数起始值</label>
                    <input type="number" name="usage_count" class="form-control" min="0" value="{{ old('usage_count', 0) }}">
                    <div class="form-hint">已有使用记录的旧版可填历史次数</div>
                </div>
                <div class="form-group">
                    <label class="form-label">设计寿命上限 (次)<span class="required">*</span></label>
                    <input type="number" name="max_usage" class="form-control" min="100" required
                           value="{{ old('max_usage', 5000) }}">
                    <div class="form-hint">黄铜版通常5000-20000次，锌/镁版3000-5000次</div>
                    @error('max_usage')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">下次保养日期</label>
                    <input type="date" name="next_maintenance_date" class="form-control" value="{{ old('next_maintenance_date') }}">
                    <div class="form-hint">留空将不启用保养提醒</div>
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-20">
        <div class="card-header">
            <div class="card-title">📝 备注</div>
        </div>
        <div class="card-body">
            <textarea name="remark" class="form-textarea" rows="3"
                      placeholder="特别注意事项、工艺要求、历史问题记录等">{{ old('remark') }}</textarea>
        </div>
    </div>

    <div class="d-flex gap-12 justify-between flex-wrap">
        <a href="{{ route('plates.index') }}" class="btn btn-secondary">取消并返回</a>
        <div class="d-flex gap-8">
            <button type="reset" class="btn btn-secondary">重置表单</button>
            <button type="submit" class="btn btn-primary btn-lg">✨ 创建档案并生成 V1.0 版本</button>
        </div>
    </div>
</form>
@endsection
