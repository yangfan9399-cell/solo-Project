@extends('layouts.app')

@section('content')
<div style="text-align:center; padding:40px 0;">
    <div style="font-size:80px; margin-bottom:16px;">☂️</div>
    <h1 style="font-size:36px; font-weight:900; color:var(--fg); margin-bottom:8px;">纸伞作坊骨架装配游戏</h1>
    <p style="color:var(--muted); font-size:16px; max-width:600px; margin:0 auto 32px;">
        在纸伞作坊里选择伞骨、伞面、糊纸顺序和晾晒时间。湿度会影响开合顺滑度，材料搭配会影响成本与耐用。需要工序台、材料批次、质检结果和订单评价。
    </p>
    <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
        <a href="{{ route('games.create') }}" class="btn btn-primary" style="font-size:16px; padding:12px 32px;">🏗️ 开工作坊</a>
        <a href="{{ route('games.index') }}" class="btn btn-outline" style="font-size:16px; padding:12px 32px;">📋 作坊记录</a>
    </div>
</div>

<div class="grid grid-3 mt-4">
    <div class="card" style="text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">🦴</div>
        <h3>选择伞骨</h3>
        <p class="text-sm text-muted">从材料批次中挑选伞骨，注意缺陷标记</p>
    </div>
    <div class="card" style="text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">🌡️</div>
        <h3>湿度影响</h3>
        <p class="text-sm text-muted">环境湿度直接影响开合顺滑度</p>
    </div>
    <div class="card" style="text-align:center;">
        <div style="font-size:36px; margin-bottom:8px;">🔍</div>
        <h3>质检评价</h3>
        <p class="text-sm text-muted">质检结果和顾客订单评价，支持回滚重算</p>
    </div>
</div>

<div class="card mt-4">
    <h2>📋 种子样本总览</h2>
    <table>
        <thead>
            <tr>
                <th>样本</th>
                <th>场景</th>
                <th>关卡</th>
                <th>关键特征</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><span class="badge badge-success">样本1</span></td>
                <td>工序台正常完成</td>
                <td>学徒试炼</td>
                <td>材料合格，糊纸顺序最优，质检通过</td>
            </tr>
            <tr>
                <td><span class="badge badge-danger">样本2</span></td>
                <td>材料批次触发异常</td>
                <td>匠人考验</td>
                <td>伞骨有裂纹、伞面受潮，糊纸顺序不当，质检不通过</td>
            </tr>
            <tr>
                <td><span class="badge badge-warning">样本3</span></td>
                <td>质检结果和订单评价需要回滚或重算</td>
                <td>大师挑战</td>
                <td>湿度62%导致质检评分偏差，需回滚重算修正评分</td>
            </tr>
        </tbody>
    </table>
</div>
@endsection
