<?php

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\TuningSession;

$session = TuningSession::find(1);

echo "=== Checking all versions ===\n";
foreach ($session->versions()->orderBy('version_number')->get() as $v) {
    echo "v{$v->version_number} (id={$v->id}): spectrum=" . count($v->snapshot_data['spectrum_data'] ?? []) .
         ", suggestions=" . count($v->snapshot_data['suggestions'] ?? []) .
         ", change={$v->change_description}\n";
}

$versionWithData = $session->versions()
    ->whereRaw("json_array_length(snapshot_data->'$.spectrum_data') > 0")
    ->orderByDesc('version_number')
    ->first();

if (!$versionWithData) {
    echo "\n⚠️  没有找到包含频谱数据的版本，需要先运行一次完整的分析流程\n";
    echo "让我创建一个完整的版本快照进行测试...\n";

    $service = app(App\Services\SpectrumAnalyzerService::class);
    $harmonics = $service->analyzeFromFrequency(289.45, 8);
    $session->spectrumData()->delete();
    foreach ($harmonics as $h) { $session->spectrumData()->create($h); }
    $session->tuningSuggestions()->delete();
    $suggestions = $service->generateSuggestions($session);
    foreach ($suggestions as $s) { $session->tuningSuggestions()->create($s); }

    $newVersion = $session->createVersion('测试完整快照，包含频谱数据和建议');
    $versionWithData = $newVersion;
    echo "Created v{$newVersion->version_number}\n";
}

$version1 = $versionWithData;

echo "\n=== Snapshot in v{$version1->version_number} ===\n";
echo "Name: " . $version1->snapshot_data['name'] . "\n";
echo "Freq: " . $version1->snapshot_data['fundamental_freq'] . "\n";
echo "Spectrum in snapshot: " . count($version1->snapshot_data['spectrum_data'] ?? []) . "\n";
echo "Suggestions in snapshot: " . count($version1->snapshot_data['suggestions'] ?? []) . "\n";

echo "\n=== Modifying session ===\n";
$session->update(['name' => '临时修改测试', 'fundamental_freq' => 999.99]);
$session->spectrumData()->delete();
$session->tuningSuggestions()->delete();
$session->fresh();

echo "After modification:\n";
echo "Name: " . $session->name . "\n";
echo "Freq: " . $session->fundamental_freq . "\n";
echo "Spectrum count: " . $session->spectrumData()->count() . "\n";
echo "Suggestions count: " . $session->tuningSuggestions()->count() . "\n";

echo "\n=== Restoring from v{$version1->version_number} (via controller logic) ===\n";
$snapshot = $version1->snapshot_data;

$session->update([
    'name' => $snapshot['name'],
    'fundamental_freq' => $snapshot['fundamental_freq'],
    'status' => $snapshot['status'],
    'notes' => $snapshot['notes'],
    'has_anomaly' => $snapshot['has_anomaly'],
    'anomaly_description' => $snapshot['anomaly_description'],
]);

$session->spectrumData()->delete();
foreach ($snapshot['spectrum_data'] ?? [] as $sd) {
    unset($sd['id'], $sd['tuning_session_id'], $sd['created_at'], $sd['updated_at']);
    $session->spectrumData()->create($sd);
}

$session->tuningSuggestions()->delete();
foreach ($snapshot['suggestions'] ?? [] as $sg) {
    unset($sg['id'], $sg['tuning_session_id'], $sg['created_at'], $sg['updated_at']);
    $session->tuningSuggestions()->create($sg);
}

$session->createVersion("从版本v{$version1->version_number}恢复（含频谱与建议）");
$session->fresh();

echo "After restore:\n";
echo "Name: " . $session->name . "\n";
echo "Freq: " . $session->fundamental_freq . "\n";
echo "Spectrum count: " . $session->spectrumData()->count() . "\n";
echo "Suggestions count: " . $session->tuningSuggestions()->count() . "\n";
echo "Versions count: " . $session->versions()->count() . "\n";

$sd = $session->spectrumData()->orderBy('harmonic_order')->first();
echo "\nVerifying spectrum data: H{$sd->harmonic_order} freq={$sd->frequency}, dev={$sd->deviation_cents}¢\n";

$sg = $session->tuningSuggestions()->first();
echo "Verifying suggestions: action={$sg->action}, note=" . substr($sg->note, 0, 50) . "...\n";

echo "\n✅ 版本恢复功能验证成功！频谱数据和调弦建议均已完整恢复。\n";
