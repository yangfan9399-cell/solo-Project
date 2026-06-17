<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>{{ $data['title'] }}</title>
    <style>
        body { font-family: "Microsoft YaHei", sans-serif; color: #2d2a24; padding: 40px; }
        h1 { text-align: center; color: #5c3d2e; border-bottom: 3px solid #8b5a2b; padding-bottom: 15px; }
        h2 { color: #5c3d2e; border-left: 4px solid #8b5a2b; padding-left: 12px; margin-top: 30px; }
        .meta { text-align: center; color: #8b7355; margin-bottom: 30px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #d4c4a8; padding: 10px 12px; text-align: left; font-size: 13px; }
        th { background: #faf6f0; color: #5c3d2e; font-weight: 600; }
        tr:nth-child(even) td { background: #fdfaf5; }
        .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .info-box { background: #faf6f0; padding: 15px; border-radius: 6px; border: 1px solid #ebe0d0; }
        .info-label { font-size: 12px; color: #8b7355; }
        .info-value { font-size: 16px; font-weight: 700; color: #5c3d2e; margin-top: 5px; word-break: break-all; }
        .anomaly-danger { background: #fee2e2; border-left: 4px solid #dc2626; padding: 10px 15px; margin: 8px 0; border-radius: 4px; }
        .anomaly-warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin: 8px 0; border-radius: 4px; }
        .footer { margin-top: 40px; text-align: center; color: #8b7355; font-size: 12px; border-top: 1px solid #d4c4a8; padding-top: 15px; }
        .notes-box { background: #faf6f0; padding: 15px; border-radius: 6px; border: 1px solid #ebe0d0; white-space: pre-wrap; }
    </style>
</head>
<body>
    <h1>{{ $data['title'] }}</h1>
    <div class="meta">报告生成时间：{{ $data['generated_at'] }}</div>

    <h2>一、批次基本信息</h2>
    <div class="info-grid">
        @foreach($data['batch'] as $label => $value)
            <div class="info-box">
                <div class="info-label">{{ $label }}</div>
                <div class="info-value">{{ $value }}</div>
            </div>
        @endforeach
    </div>

    <h2>二、工艺参数详情</h2>
    <table>
        <thead>
            <tr>
                <th>参数</th>
                <th>数值</th>
                <th>标准范围</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['parameters'] as $row)
                <tr>
                    <td>{{ $row['参数'] }}</td>
                    <td>{{ $row['数值'] }}</td>
                    <td>{{ $row['标准范围'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if(!empty($data['anomalies']))
        <h2>三、异常数据记录</h2>
        @foreach($data['anomalies'] as $anomaly)
            <div class="{{ $anomaly['异常等级'] == '严重' ? 'anomaly-danger' : 'anomaly-warning' }}">
                <strong>[{{ $anomaly['异常等级'] }}]</strong> {{ $anomaly['异常描述'] }}
                <br><small>实际值：{{ $anomaly['实际值'] }} · 处理状态：{{ $anomaly['处理状态'] }}</small>
                <br><small>💡 建议：{{ $anomaly['建议方案'] }}</small>
            </div>
        @endforeach
    @endif

    <h2>四、版本历史</h2>
    <table>
        <thead>
            <tr>
                @foreach(array_keys($data['versions'][0]) as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($data['versions'] as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>五、备注</h2>
    <div class="notes-box">{{ $data['notes'] }}</div>

    <div class="footer">
        传统榨油坊批次压榨记录系统 · 本报告由系统自动生成
    </div>
</body>
</html>
