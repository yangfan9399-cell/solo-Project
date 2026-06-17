@extends('layouts.app')

@section('title', '新建批次记录')
@section('page-title', '新建批次记录')

@section('content')
    <form method="POST" action="{{ route('batches.store') }}" id="batchForm">
        @csrf

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
                                <option value="{{ $type }}" {{ $defaultSeedType == $type ? 'selected' : '' }}>{{ $type }}</option>
                            @endforeach
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">生产日期<span class="required">*</span></label>
                        <input type="date" name="production_date" class="form-input" value="{{ $defaultProductionDate }}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">操作员</label>
                        <input type="text" name="operator" class="form-input" placeholder="如: 张师傅">
                    </div>
                    <div class="form-group">
                        <label class="form-label">原料重量(kg)<span class="required">*</span></label>
                        <input type="number" name="seed_weight" step="0.01" min="0" class="form-input" placeholder="如: 500" required id="seedWeight">
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">🔥 炒制工艺参数</div>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">原料水分含量(%)<span class="required">*</span></label>
                        <input type="number" name="moisture_content" step="0.01" min="0" max="100" class="form-input" placeholder="如: 8.5" required id="moisture">
                        <div class="text-xs text-muted mt-2" id="moistureTip">标准范围随油料种类变化</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">炒籽温度(℃)<span class="required">*</span></label>
                        <input type="number" name="roasting_temperature" step="0.01" min="0" max="300" class="form-input" placeholder="如: 145" required id="roastTemp">
                        <div class="text-xs text-muted mt-2" id="roastTempTip">标准范围随油料种类变化</div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">炒籽时长(分钟)<span class="required">*</span></label>
                        <input type="number" name="roasting_duration" min="0" class="form-input" placeholder="如: 35" required id="roastTime">
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">⚙️ 压榨与沉淀参数</div>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">压榨压力(MPa)<span class="required">*</span></label>
                        <input type="number" name="pressing_pressure" step="0.01" min="0" max="200" class="form-input" placeholder="如: 38" required id="pressPressure">
                    </div>
                    <div class="form-group">
                        <label class="form-label">压榨时长(分钟)<span class="required">*</span></label>
                        <input type="number" name="pressing_duration" min="0" class="form-input" placeholder="如: 60" required id="pressTime">
                    </div>
                    <div class="form-group">
                        <label class="form-label">出油量(L)<span class="required">*</span></label>
                        <input type="number" name="oil_output" step="0.01" min="0" class="form-input" placeholder="如: 215" required id="oilOutput">
                    </div>
                    <div class="form-group">
                        <label class="form-label">沉淀时间(小时)<span class="required">*</span></label>
                        <input type="number" name="settling_time" min="0" class="form-input" placeholder="如: 48" required id="settlingTime">
                    </div>
                    <div class="form-group">
                        <label class="form-label">沉淀物量(kg)</label>
                        <input type="number" name="sediment_amount" step="0.01" min="0" class="form-input" placeholder="如: 12.5" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">预期出油率(%)</label>
                        <div class="form-input" style="background: #faf6f0;" id="calcYieldRate">-- 自动计算 --</div>
                        <div class="text-xs text-muted mt-2">根据原料重量和出油量自动计算</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">📝 备注</div>
            </div>
            <div class="card-body">
                <textarea name="notes" rows="4" class="form-input" placeholder="记录本批次的特殊情况、工艺调整等信息..."></textarea>
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
            <a href="{{ route('batches.index') }}" class="btn btn-secondary">取消</a>
            <button type="submit" class="btn btn-primary">保存批次记录</button>
        </div>
    </form>

    <script>
        const seedThresholds = {
            '花生': { moisture: [5.0, 10.0], roastTemp: [120, 160] },
            '菜籽': { moisture: [4.0, 9.0], roastTemp: [130, 170] },
            '芝麻': { moisture: [3.0, 7.0], roastTemp: [140, 180] },
            '大豆': { moisture: [6.0, 12.0], roastTemp: [110, 150] },
            '茶籽': { moisture: [4.0, 8.0], roastTemp: [125, 165] },
            '核桃': { moisture: [3.0, 8.0], roastTemp: [100, 140] },
        };

        function updateThresholdTips() {
            const seedType = document.getElementById('seedType').value;
            const t = seedThresholds[seedType];
            if (t) {
                document.getElementById('moistureTip').textContent =
                    '标准范围: ' + t.moisture[0] + ' - ' + t.moisture[1] + ' %';
                document.getElementById('roastTempTip').textContent =
                    '标准范围: ' + t.roastTemp[0] + ' - ' + t.roastTemp[1] + ' ℃';
            }
        }

        function calculateYield() {
            const seedWeight = parseFloat(document.getElementById('seedWeight').value) || 0;
            const oilOutput = parseFloat(document.getElementById('oilOutput').value) || 0;
            if (seedWeight > 0) {
                const oilDensity = 0.92;
                const oilWeightKg = oilOutput * oilDensity;
                const yieldRate = ((oilWeightKg / seedWeight) * 100).toFixed(2);
                document.getElementById('calcYieldRate').textContent = yieldRate + ' %';
            } else {
                document.getElementById('calcYieldRate').textContent = '-- 自动计算 --';
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

            if (moisture === 0 || roastTemp === 0 || seedWeight === 0 || oilOutput === 0) {
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
                const response = await fetch('{{ route("batches.check-anomalies") }}?' + formData.toString());
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

        document.getElementById('seedType').addEventListener('change', function() {
            updateThresholdTips();
            checkAnomalies();
        });
        ['moisture', 'roastTemp', 'roastTime', 'pressPressure', 'pressTime', 'settlingTime', 'seedWeight', 'oilOutput']
            .forEach(id => {
                const el = document.getElementById(id);
                el.addEventListener('input', function() {
                    calculateYield();
                    checkAnomalies();
                });
            });

        updateThresholdTips();
    </script>
@endsection
