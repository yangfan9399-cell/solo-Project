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
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background: #faf6f0; padding: 15px; border-radius: 6px; border: 1px solid #ebe0d0; }
        .stat-label { font-size: 12px; color: #8b7355; }
        .stat-value { font-size: 22px; font-weight: 700; color: #5c3d2e; }
        .footer { margin-top: 40px; text-align: center; color: #8b7355; font-size: 12px; border-top: 1px solid #d4c4a8; padding-top: 15px; }
    </style>
</head>
<body>
    <h1>{{ $data['title'] }}</h1>
    <div class="meta">报告生成时间：{{ $data['generated_at'] }}</div>

    <h2>一、统计概览</h2>
    <div class="stat-grid">
        @foreach($data['statistics'] as $label => $value)
            <div class="stat-box">
                <div class="stat-label">{{ $label }}</div>
                <div class="stat-value">{{ $value }}</div>
            </div>
        @endforeach
    </div>

    <h2>二、油料种类分布</h2>
    <table>
        <thead>
            <tr>
                <th>油料种类</th>
                <th>批次数</th>
                <th>平均出油率(%)</th>
                <th>总出油量(L)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data['seed_type_breakdown'] as $seedType => $values)
                <tr>
                    <td>{{ $seedType }}</td>
                    <td>{{ $values['count'] }}</td>
                    <td>{{ $values['avg_yield'] }}</td>
                    <td>{{ $values['total_oil'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <h2>三、批次明细</h2>
    <table>
        <thead>
            <tr>
                @if(!empty($data['batches']))
                    @foreach(array_keys($data['batches'][0]) as $header)
                        <th>{{ $header }}</th>
                    @endforeach
                @endif
            </tr>
        </thead>
        <tbody>
            @foreach($data['batches'] as $row)
                <tr>
                    @foreach($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        传统榨油坊批次压榨记录系统 · 本报告由系统自动生成
    </div>
</body>
</html>
