<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DrumMasterRecord;
use App\Models\DrumDetailRecord;
use App\Models\TensionHistoryRecord;
use App\Models\TuningResultRecord;
use App\Models\SpectrumDatum;
use App\Models\TensionTable;
use App\Models\TuningComparison;
use App\Services\SpectrumAnalysisService;
use App\Services\TensionTableService;
use App\Services\TuningComparisonService;
use Illuminate\Support\Facades\DB;

class DrumTuningSeeder extends Seeder
{
    protected $spectrumService;
    protected $tensionTableService;
    protected $comparisonService;

    public function __construct(
        SpectrumAnalysisService $spectrumService,
        TensionTableService $tensionTableService,
        TuningComparisonService $comparisonService
    ) {
        $this->spectrumService = $spectrumService;
        $this->tensionTableService = $tensionTableService;
        $this->comparisonService = $comparisonService;
    }

    public function run(): void
    {
        DB::transaction(function () {
            $record1 = $this->createNormalRecord();
            $record2 = $this->createAnomalyRecord();
            $record3 = $this->createRollbackRecord();
            
            $this->createComparison([$record1->id, $record2->id, $record3->id]);
        });
    }

    protected function createNormalRecord(): DrumMasterRecord
    {
        $master = DrumMasterRecord::create([
            'batch_number' => 'DRUM-2024-001',
            'version' => '1.2',
            'drum_diameter' => 14.0,
            'musician_name' => '张明远',
            'record_date' => '2024-03-15',
            'status' => 'completed',
            'notes' => '春季巡演标准调校方案，适用于中型剧场演出。经过三次微调后达到理想音色，低音浑厚、高音清亮。',
        ]);

        DrumDetailRecord::create([
            'drum_master_record_id' => $master->id,
            'drumhead_material' => '牛皮',
            'drumhead_brand' => 'Remo',
            'drumhead_thickness' => 0.250,
            'drum_side' => 'batter',
            'sort_order' => 1,
        ]);

        DrumDetailRecord::create([
            'drum_master_record_id' => $master->id,
            'drumhead_material' => '羊皮',
            'drumhead_brand' => 'Evans',
            'drumhead_thickness' => 0.180,
            'drum_side' => 'resonant',
            'sort_order' => 2,
        ]);

        $tensionPoints = [
            ['tension' => 280.5, 'point' => 1, 'turns' => 0, 'reason' => '初始张力'],
            ['tension' => 310.2, 'point' => 2, 'turns' => 0.25, 'reason' => '第一次微调'],
            ['tension' => 335.8, 'point' => 3, 'turns' => 0.2, 'reason' => '第二次微调'],
            ['tension' => 342.0, 'point' => 4, 'turns' => 0.1, 'reason' => '最终校准'],
            ['tension' => 345.5, 'point' => 5, 'turns' => 0.05, 'reason' => '演出前检查'],
        ];

        foreach ($tensionPoints as $idx => $tp) {
            TensionHistoryRecord::create([
                'drum_master_record_id' => $master->id,
                'rope_tension' => $tp['tension'],
                'tension_unit' => 'N',
                'measurement_point' => $tp['point'],
                'tuning_key_turns' => $tp['turns'],
                'operator' => '李师傅',
                'is_rollback' => false,
                'adjustment_reason' => $tp['reason'],
                'measured_at' => now()->subDays(5 - $idx)->addHours($idx * 2),
            ]);
        }

        $result = TuningResultRecord::create([
            'drum_master_record_id' => $master->id,
            'strike_frequency' => 220.5,
            'target_frequency' => 220.0,
            'performance_environment' => '剧场',
            'ambient_temp' => 22.5,
            'ambient_humidity' => 55.0,
            'ambient_pressure' => 1013.2,
            'performance_notes' => '剧场演出效果良好，低音区共鸣饱满，高频泛音清晰，适合传统鼓乐独奏和合奏。观众席前后排听觉差异较小，整体音色均匀。',
            'sound_quality_assessment' => '优秀：音色圆润饱满，泛音丰富，动态范围大',
            'spectrum_anomaly' => false,
            'anomaly_type' => null,
            'anomaly_description' => null,
        ]);

        $spectrum = $this->spectrumService->generateSpectrum($result);
        $this->spectrumService->saveSpectrum($result, $spectrum);

        $tableData = $this->tensionTableService->generateTensionTable($master, '标准调校表', [
            'min_tension' => 200,
            'max_tension' => 450,
            'point_count' => 10,
            'target_frequency' => 220.0,
        ]);
        $this->tensionTableService->saveTensionTable($master, '标准调校表', $tableData, [
            'note' => '初始版本 - 基于牛皮鼓面计算',
        ]);

        return $master;
    }

    protected function createAnomalyRecord(): DrumMasterRecord
    {
        $master = DrumMasterRecord::create([
            'batch_number' => 'DRUM-2024-002',
            'version' => '1.0',
            'drum_diameter' => 16.0,
            'musician_name' => '李传统',
            'record_date' => '2024-04-02',
            'status' => 'draft',
            'notes' => '户外节庆演出用大鼓，频谱检测发现异常，待进一步调试。怀疑与潮湿天气有关，鼓皮可能受潮。',
        ]);

        DrumDetailRecord::create([
            'drum_master_record_id' => $master->id,
            'drumhead_material' => '牛皮',
            'drumhead_brand' => '传统手工',
            'drumhead_thickness' => 0.320,
            'drum_side' => 'batter',
            'sort_order' => 1,
        ]);

        TensionHistoryRecord::create([
            'drum_master_record_id' => $master->id,
            'rope_tension' => 420.0,
            'tension_unit' => 'N',
            'measurement_point' => 1,
            'tuning_key_turns' => 0,
            'operator' => '王师傅',
            'is_rollback' => false,
            'adjustment_reason' => '初始设置',
            'measured_at' => now()->subHours(6),
        ]);

        TensionHistoryRecord::create([
            'drum_master_record_id' => $master->id,
            'rope_tension' => 445.5,
            'tension_unit' => 'N',
            'measurement_point' => 2,
            'tuning_key_turns' => 0.3,
            'operator' => '王师傅',
            'is_rollback' => false,
            'adjustment_reason' => '尝试提升高音',
            'measured_at' => now()->subHours(3),
        ]);

        $result = TuningResultRecord::create([
            'drum_master_record_id' => $master->id,
            'strike_frequency' => 165.0,
            'target_frequency' => 164.0,
            'performance_environment' => '露天',
            'ambient_temp' => 28.0,
            'ambient_humidity' => 75.0,
            'ambient_pressure' => 1008.5,
            'performance_notes' => '户外演出时发现音色发闷，低音不够清晰，有明显的嗡嗡声。怀疑鼓皮受潮导致张力不均，需要在干燥环境下重新调校。',
            'sound_quality_assessment' => '一般：低频浑浊，中频不够突出，高频衰减快',
            'spectrum_anomaly' => true,
            'anomaly_type' => 'subharmonic',
            'anomaly_description' => '检测到次谐波分量，可能存在鼓皮松弛或异物共振',
        ]);

        $spectrum = $this->spectrumService->generateAnomalySpectrum(165.0, 'subharmonic');
        $this->spectrumService->saveSpectrum($result, $spectrum);

        $tableData = $this->tensionTableService->generateTensionTable($master, '户外调校表', [
            'min_tension' => 350,
            'max_tension' => 550,
            'point_count' => 12,
            'target_frequency' => 164.0,
        ]);
        $this->tensionTableService->saveTensionTable($master, '户外调校表', $tableData, [
            'note' => '适用于户外演出',
        ]);

        return $master;
    }

    protected function createRollbackRecord(): DrumMasterRecord
    {
        $master = DrumMasterRecord::create([
            'batch_number' => 'DRUM-2024-003',
            'version' => '2.1',
            'drum_diameter' => 12.0,
            'musician_name' => '王小鼓',
            'record_date' => '2024-05-10',
            'status' => 'completed',
            'notes' => '录音棚专用小鼓，经过多轮调试和回滚。最终选择了1.0版本的参数，因为新版本在录音中表现不如预期。',
        ]);

        DrumDetailRecord::create([
            'drum_master_record_id' => $master->id,
            'drumhead_material' => '合成皮',
            'drumhead_brand' => 'Remo Powerstroke',
            'drumhead_thickness' => 0.200,
            'drum_side' => 'batter',
            'sort_order' => 1,
        ]);

        $tensions = [
            ['t' => 250.0, 'p' => 1, 'tu' => 0, 'r' => '初始设置 - v1.0基准'],
            ['t' => 275.5, 'p' => 2, 'tu' => 0.2, 'r' => '录音测试微调'],
            ['t' => 290.0, 'p' => 3, 'tu' => 0.15, 'r' => '提升攻击感'],
            ['t' => 268.0, 'p' => 4, 'tu' => -0.25, 'r' => '回调 - 感觉太硬'],
            ['t' => 272.5, 'p' => 5, 'tu' => 0.05, 'r' => '最终微调 - 确定v1.0'],
        ];

        foreach ($tensions as $idx => $t) {
            TensionHistoryRecord::create([
                'drum_master_record_id' => $master->id,
                'rope_tension' => $t['t'],
                'tension_unit' => 'N',
                'measurement_point' => $t['p'],
                'tuning_key_turns' => $t['tu'],
                'operator' => '陈录音师',
                'is_rollback' => false,
                'adjustment_reason' => $t['r'],
                'measured_at' => now()->subDays(10 - $idx * 2)->addHours($idx * 3),
            ]);
        }

        $tableData_v1 = $this->tensionTableService->generateTensionTable($master, '录音棚专用表', [
            'min_tension' => 180,
            'max_tension' => 380,
            'point_count' => 10,
            'target_frequency' => 330.0,
        ]);
        $this->tensionTableService->saveTensionTable($master, '录音棚专用表', $tableData_v1, [
            'note' => 'v1.0 - 合成皮标准参数',
            'version' => '1.0',
        ]);

        TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', '录音棚专用表')
            ->where('table_version', '1.0')
            ->update(['table_version' => '1.0']);

        $result_v1 = TuningResultRecord::create([
            'drum_master_record_id' => $master->id,
            'strike_frequency' => 330.0,
            'target_frequency' => 330.0,
            'performance_environment' => '录音棚',
            'ambient_temp' => 23.0,
            'ambient_humidity' => 50.0,
            'ambient_pressure' => 1015.0,
            'performance_notes' => 'v1.0版本：录音效果很好，音色干净，适合流行音乐录制。攻击速度适中，延音恰到好处。',
            'sound_quality_assessment' => '优秀：音色干净利落，音头清晰，延音适中',
            'spectrum_anomaly' => false,
        ]);

        $spectrum_v1 = $this->spectrumService->generateSpectrum($result_v1);
        $this->spectrumService->saveSpectrum($result_v1, $spectrum_v1);

        $recalcResult = $this->tensionTableService->recalculateTensionTable($master, '录音棚专用表', [
            'drum_diameter' => 12.5,
            'drumhead_material' => '牛皮',
            'target_frequency' => 350.0,
        ]);

        $result_v2 = TuningResultRecord::create([
            'drum_master_record_id' => $master->id,
            'strike_frequency' => 355.0,
            'target_frequency' => 350.0,
            'performance_environment' => '录音棚',
            'ambient_temp' => 22.8,
            'ambient_humidity' => 48.0,
            'ambient_pressure' => 1014.5,
            'performance_notes' => 'v2.0实验版本：更换了鼓皮材质并调整了鼓径参数。测试后发现音色过于尖锐，低频不足，不适合当前的音乐风格。决定回滚到v1.0的参数。',
            'sound_quality_assessment' => '一般：音头过硬，低频不足，长时间听感疲劳',
            'spectrum_anomaly' => false,
        ]);

        $spectrum_v2 = $this->spectrumService->generateSpectrum($result_v2);
        $this->spectrumService->saveSpectrum($result_v2, $spectrum_v2);

        $this->tensionTableService->rollbackTensionTable($master, '录音棚专用表', '1.0');

        TensionHistoryRecord::create([
            'drum_master_record_id' => $master->id,
            'rope_tension' => 272.5,
            'tension_unit' => 'N',
            'measurement_point' => 6,
            'tuning_key_turns' => 0,
            'operator' => '陈录音师',
            'is_rollback' => true,
            'rollback_from_id' => 1,
            'adjustment_reason' => '回滚至v1.0参数 - v2.0音色不理想',
            'measured_at' => now()->subDay(),
        ]);

        $master->update(['status' => 'completed']);

        return $master;
    }

    protected function createComparison(array $recordIds): void
    {
        $comparison = $this->comparisonService->createComparison(
            $recordIds,
            '春季演出方案对比',
            '对比三个不同的调校方案，为春季巡演选择最佳方案。包括剧场标准方案、户外方案和录音棚方案的对比。'
        );

        $this->comparisonService->executeComparison($comparison);
    }
}
