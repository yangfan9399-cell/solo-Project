@extends('layouts.app')

@section('title', '编辑批次 - ' . $batch->batch_code)
@section('page-title', '编辑批次 - ' . $batch->batch_code)

@section('content')
    <div class="alert alert-info">
        <strong>提示：</strong> 修改此批次将自动创建新版本 v{{ $batch->version + 1 }}，原版本数据将保存在历史记录中可随时回滚。
    </div>

    <form method="POST" action="{{ route('batches.update', $batch) }}" id="batchForm">
        @csrf
        @method('PUT')
        <input type="hidden" name="expected_version" value="{{ $batch->version }}">

        <div class="card">
            <div class="card-header">
                <div class="card-title">📝 基础信息</div>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">油料种类<span class="required">*</span></label>
                        <select name="seed_type" class="form-input" id="seedType" required>
                            @foreach($seedTypes as $type)
                                <option value="{{ $type }}" {{ $batch->seed_type == $type ? 'selected' : '' }}>{{ $type }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">生产日期<span class="required">*</span></label>
                        <input type="date" name="production_date" class="form-input" value="{{ $batch->production_date->format('Y-m-d') }}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">操作员</label>
                        <input type="text" name="operator" class="form-input" value="{{ $batch->operator }}" placeholder="如: 张师傅">
                    </div>
                    <div class="form-group">
                        <label class="form-label">原料重量(kg)<span class="required">*</span></label>
                        <input type="number" name="seed_weight" step="0.01" min="0" class="form-input" value="{{ $batch->seed_weight }}" required id="seedWeight">
                    </div>
                </div>
                <div class="form-group mt-4">
                    <label class="form-label">本次变更说明</label>
                    <input type="text" name="change_summary" class="form-input" placeholder="简要说明修改内容，如：调整炒籽温度参数" maxlength="255">
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">🔥 炒制工艺参数</div>
                <div class="text-sm text-muted">
                    标准范围：水分 {{ $thresholds['moisture_min'] }}-{{ $thresholds['moisture_max'] }}%，温度 {{ $thresholds['roasting_temp_min'] }}-{{ $thresholds['roasting_temp_max'] }}℃
                </div>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">原料水分含量(%)<span class="required">*</span></label>
                        <input type="number" name="moisture_content" step="0.01" min="0" max="100" class="form-input" value="{{ $batch->moisture_content }}" required id="moisture">
                    </div>
                    <div class="form-group">
                        <label class="form-label">炒籽温度(℃)<span class="required">*</span></label>
                        <input type="number" name="roasting_temperature" step="0.01" min="0" max="300" class="form-input" value="{{ $batch->roasting_temperature }}" required id="roastTemp">
                    </div>
                    <div class="form-group">
                        <label class="form-label">炒籽时长(分钟)<span class="required">*</span></label>
                        <input type="number" name="roasting_duration" min="0" class="form-input" value="{{ $batch->roasting_duration }}" required id="roastTime">
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">⚙️ 压榨与沉淀参数</div>
                <div class="text-sm text-muted">
                    压力 {{ $thresholds['pressing_pressure_min'] }}-{{ $thresholds['pressing_pressure_max'] }}MPa，出油率 {{ $thresholds['oil_yield_min'] }}-{{ $thresholds['oil_yield_max'] }}%
                </div>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">压榨压力(MPa)<span class="required">*</span></label>
                        <input type="number" name="pressing_pressure" step="0.01" min="0" max="200" class="form-input" value="{{ $batch->pressing_pressure }}" required id="pressPressure">
                    </div>
                    <div class="form-group">
                        <label class="form-label">压榨时长(分钟)<span class="required">*</span></label>
                        <input type="number" name="pressing_duration" min="0" class="form-input" value="{{ $batch->pressing_duration }}" required id="pressTime">
                    </div>
                    <div class="form-group">
                        <label class="form-label">出油量(L)<span class="required">*</span></label>
                        <input type="number" name="oil_output" step="0.01" min="0" class="form-input" value="{{ $batch->oil_output }}" required id="oilOutput">
                    </div>
                    <div class="form-group">
                        <label class="form-label">沉淀时间(小时)<span class="required">*</span></label>
                        <input type="number" name="settling_time" min="0" class="form-input" value="{{ $batch->settling_time }}" required id="settlingTime">
                    </div>
                    <div class="form-group">
                        <label class="form-label">沉淀物量(kg)</label>
                        <input type="number" name="sediment_amount" step="0.01" min="0" class="form-input" value="{{ $batch->sediment_amount }}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">计算出油率(%)</label>
                        <div class="form-input" style="background: #faf6f0;" id="calcYieldRate">{{ $batch->oil_yield_rate }} %</div>
                        <div class="text-xs text-muted mt-2">系统自动计算并保存</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">📝 备注</div>
            </div>
            <div class="card-body">
                <textarea name="notes" rows="4" class="form-input" placeholder="记录本批次的特殊情况、工艺调整等信息...">{{ $batch->notes }}</textarea>
            </div>
        </div>

        <div class="card" id="anomalyCard" style="display: none;">
            <div class="card-header">
                <div class="card-title">⚠️ 实时异常检测</div>
                <div id="anomalySummary" class="text-sm"></div>
            </div>
            <div class="card-body">
                <div id="anomalyList"></div>
            </div>
        </div>

        <div class="btn-group" style="justify-content: flex-end;">
            <a href="{{ route('batches.show', $batch) }}" class="btn btn-secondary">取消</a>
            <button type="submit" class="btn btn-primary">保存并创建新版本</button>
        </div>
    </form>

    <script>
        function calculateYield() {
            const seedWeight = parseFloat(document.getElementById('seedWeight').value) || 0;
            const oilOutput = parseFloat(document.getElementById('oilOutput').value) || 0;
            if (seedWeight > 0) {
                const oilDensity = 0.92;
                const oilWeightKg = oilOutput * oilDensity;
                const yieldRate = ((oilWeightKg / seedWeight) * 100).toFixed(2);
                document.getElementById('calcYieldRate').textContent = yieldRate + ' %';
            }
        }

        async function checkAnomalies() {
            const seedType = document.getElementById('seedType').value;
            const moisture = parseFloat(document.getElementById('moisture').value) || 0;
            const roastTemp = parseFloat(document.getElementById('roastTemp').value) || 0;
            const roastTime = parseInt(document.getElementById('roastTime').value) || 0;
            const pressPressure = parseFloat(document.getElementById('pressPressure').value) || 0;
            const pressTime = parseInt(document.getElementById('pressTime').value) || 0;
            const settlingTime = parseInt(document.getElementById('settlingTime').value) || 0;

            const seedWeight = parseFloat(document.getElementById('seedWeight').value) || 0;
            const oilOutput = parseFloat(document.getElementById('oilOutput').value) || 0;
            let oilYieldRate = 0;
            if (seedWeight > 0) {
                oilYieldRate = ((oilOutput * 0.92 / seedWeight) * 100);
            }

            if (moisture === 0 || roastTemp === 0) {
                document.getElementById('anomalyCard').style.display = 'none';
                return;
            }

            const formData = new URLSearchParams({
                seed_type: seedType,
                moisture_content: moisture,
                roasting_temperature: roastTemp,
                roasting_duration: roastTime,
                pressing_pressure: pressPressure,
                pressing_duration: pressTime,
                oil_yield_rate: oilYieldRate,
                settling_time: settlingTime,
            });

            try {
                const batchId = {{ $batch->id }};
                const response = await fetch('/batches/' + batchId + '/anomalies?' + formData.toString());
                const data = await response.json();

                if (data.count > 0) {
                    document.getElementById('anomalyCard').style.display = 'block';
                    document.getElementById('anomalySummary').innerHTML =
                        '检测到 <strong>' + data.count + '</strong> 项异常 (严重: ' + data.high_count +
                        ', 中等: ' + data.medium_count + ', 轻微: ' + data.low_count + ')';

                    const typeLabels = { high: '严重', medium: '中等', low: '轻微' };
                    const typeClasses = { high: 'anomaly-high', medium: 'anomaly-medium', low: 'anomaly-low' };
                    let html = '';
                    data.anomalies.forEach(a => {
                        html += '<div class="anomaly-item ' + typeClasses[a.anomaly_type] + '">';
                        html += '<strong>[' + typeLabels[a.anomaly_type] + ']</strong> ' + a.description;
                        html += '<div class="text-xs text-muted mt-2">💡 ' + a.suggestion + '</div>';
                        html += '</div>';
                    });
                    document.getElementById('anomalyList').innerHTML = html;
                } else {
                    document.getElementById('anomalyCard').style.display = 'none';
                }
            } catch (e) {
                console.error(e);
            }
        }

        ['seedType', 'moisture', 'roastTemp', 'roastTime', 'pressPressure', 'pressTime', 'settlingTime', 'seedWeight', 'oilOutput']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('input', function() {
                        calculateYield();
                        checkAnomalies();
                    });
                    el.addEventListener('change', function() {
                        calculateYield();
                        checkAnomalies();
                    });
                }
            });

        calculateYield();
        checkAnomalies();
    </script>
@endsection
