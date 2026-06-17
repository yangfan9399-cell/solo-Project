@extends('layouts.app')
@section('title', '编辑 - ' . $plate->plate_code)

@section('content')
<div class="page-header">
    <div>
        <div class="page-title">
            编辑烫金版档案
            <span class="badge badge-gold" style="font-size:16px; padding:4px 12px;">{{ $plate->plate_code }}</span>
        </div>
        <div class="page-subtitle">
            修改信息并可选生成版本快照 · 当前版本 {{ $plate->versionHistories->first()->version_code ?? 'V1.0' }}
            · 最后更新于 {{ $plate->updated_at->format('Y-m-d H:i') }}
            · <a href="{{ route('plates.show', $plate) }}" class="text-gold fw-bold">← 返回详情页</a>
        </div>
    </div>
    <a href="{{ route('plates.show', $plate) }}" class="btn btn-secondary">取消</a>
</div>

@if($errors->has('conflict_warning'))
<div class="alert alert-danger mb-20">
    <span>⚠️</span>
    <div>
        <div class="fw-bold mb-4">版本冲突检测</div>
        <div>{{ $errors->first('conflict_warning') }}</div>
        <div class="mt-8" style="padding:12px; background:#FEF2F2; border-radius:6px; border:1px solid #FECACA;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" name="_force_update" value="1" form="edit-form" style="width:18px; height:18px;">
                <span class="fw-bold">我已确认变更内容，强制保存并生成「冲突保留」版本记录</span>
            </label>
        </div>
    </div>
</div>
@endif

@if($errors->has('error'))
<div class="alert alert-danger mb-20">
    <span>❌</span>
    <div>{{ $errors->first('error') }}</div>
</div>
@endif

<form id="edit-form" method="POST" action="{{ route('plates.update', $plate) }}">
    @csrf @method('PUT')
    <input type="hidden" name="_lock_updated_at" value="{{ old('_lock_updated_at', $plate->updated_at->format('Y-m-d H:i:s')) }}">

    <div class="card mb-20">
        <div class="card-header">
            <div class="card-title">📋 基本信息</div>
            <span class="text-sm text-muted">
                版本锁定：{{ $plate->updated_at->format('Y-m-d H:i') }} · 编辑期间如有他人修改将触发冲突检测
            </span>
        </div>
        <div class="card-body">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">版号编码<span class="required">*</span></label>
                    <input type="text" name="plate_code" class="form-control" required
                           value="{{ old('plate_code', $plate->plate_code) }}">
                    @error('plate_code')<div class="form-error">{{ $message }}</div>@enderror
                </div>
                <div class="form-group">
                    <label class="form-label">图案名称<span class="required">*</span></label>
                    <input type="text" name="pattern_name" class="form-control" required
                           value="{{ old('pattern_name', $plate->pattern_name) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">材质<span class="required">*</span></label>
                    <select name="material" class="form-select" required>
                        @foreach($materials as $m)
                            <option value="{{ $m }}" {{ old('material', $plate->material) === $m ? 'selected' : '' }}>{{ $m }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">当前状态<span class="required">*</span></label>
                    <select name="status" class="form-select" required>
                        @foreach($statuses as $st)
                            <option value="{{ $st }}" {{ old('status', $plate->status) === $st ? 'selected' : '' }}>{{ $st }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">图案描述</label>
                <textarea name="pattern_description" class="form-textarea" rows="3">{{ old('pattern_description', $plate->pattern_description) }}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">适用书名<span class="required">*</span></label>
                <textarea name="applicable_books" class="form-textarea" rows="3" required
                          placeholder="每行一本书名">{{ old('applicable_books', $plate->applicable_books) }}</textarea>
                <div class="form-hint">每行一个，或逗号/顿号分隔</div>
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
                    <input type="number" name="plate_width" step="0.01" min="1" class="form-control" required
                           value="{{ old('plate_width', $plate->plate_width) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">高度 (mm)<span class="required">*</span></label>
                    <input type="number" name="plate_height" step="0.01" min="1" class="form-control" required
                           value="{{ old('plate_height', $plate->plate_height) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">厚度 (mm)<span class="required">*</span></label>
                    <input type="number" name="plate_thickness" step="0.1" min="0.5" max="10" class="form-control" required
                           value="{{ old('plate_thickness', $plate->plate_thickness) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">存放位置</label>
                    <input type="text" name="location" class="form-control"
                           value="{{ old('location', $plate->location) }}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">制作日期</label>
                    <input type="date" name="manufacture_date" class="form-control"
                           value="{{ old('manufacture_date', $plate->manufacture_date ? $plate->manufacture_date->format('Y-m-d') : '') }}">
                </div>
                <div class="form-group">
                    <label class="form-label">使用次数</label>
                    <input type="number" name="usage_count" min="0" class="form-control"
                           value="{{ old('usage_count', $plate->usage_count) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">设计寿命上限 (次)<span class="required">*</span></label>
                    <input type="number" name="max_usage" min="100" class="form-control" required
                           value="{{ old('max_usage', $plate->max_usage) }}">
                </div>
                <div class="form-group">
                    <label class="form-label">下次保养日期</label>
                    <input type="date" name="next_maintenance_date" class="form-control"
                           value="{{ old('next_maintenance_date', $plate->next_maintenance_date ? $plate->next_maintenance_date->format('Y-m-d') : '') }}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">最近使用时间</label>
                    <input type="date" name="last_used_at" class="form-control"
                           value="{{ old('last_used_at', $plate->last_used_at ? $plate->last_used_at->format('Y-m-d') : '') }}">
                </div>
            </div>
        </div>
    </div>

    <div class="card mb-20">
        <div class="card-header">
            <div class="card-title">📝 备注说明</div>
        </div>
        <div class="card-body">
            <textarea name="remark" class="form-textarea" rows="3"
                      placeholder="特别注意事项、工艺要求等">{{ old('remark', $plate->remark) }}</textarea>
        </div>
    </div>

    <div class="card mb-20" style="border:2px solid var(--primary-light); background:#FFFBEB;">
        <div class="card-header" style="background:var(--gold-gradient);">
            <div class="card-title" style="color:#3D2914;">🔄 版本记录生成（可选）</div>
        </div>
        <div class="card-body">
            <div class="alert alert-info mb-16">
                <span>ℹ️</span>
                <div>系统会自动检测字段变更。如检测到修改，将自动生成新版本快照。您也可手动勾选「强制生成版本」并填写变更说明。</div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">变更类型</label>
                    <select name="change_type" class="form-select">
                        <option value="">自动检测</option>
                        @foreach($changeTypes as $ct)
                            <option value="{{ $ct }}" {{ old('change_type') === $ct ? 'selected' : '' }}>{{ $ct }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group" style="display:flex; align-items:flex-end;">
                    <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:#FFF; border:1px solid var(--border); border-radius:6px; cursor:pointer;">
                        <input type="checkbox" name="version_note" value="1" style="width:18px; height:18px;">
                        <span class="fw-bold">无论是否修改都强制生成版本记录</span>
                    </label>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">变更说明描述</label>
                <textarea name="change_description" class="form-textarea" rows="2"
                          placeholder="请详细说明本次修改内容，如：调整祥云纹线条宽度、修改边框样式等">{{ old('change_description') }}</textarea>
            </div>
        </div>
    </div>

    <div class="d-flex gap-12 justify-between flex-wrap">
        <a href="{{ route('plates.show', $plate) }}" class="btn btn-secondary">取消并返回详情</a>
        <div class="d-flex gap-8">
            <button type="reset" class="btn btn-secondary">重置</button>
            <button type="submit" class="btn btn-primary btn-lg">💾 保存修改</button>
        </div>
    </div>
</form>
@endsection
