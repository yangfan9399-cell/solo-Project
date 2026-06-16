<?php

namespace Database\Seeders;

use App\Models\Instrument;
use App\Models\ToneLibrary;
use App\Models\TuningSession;
use App\Models\SpectrumData;
use App\Models\TuningSuggestion;
use App\Models\SessionVersion;
use App\Models\PracticeRecord;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $instruments = $this->seedInstruments();
        $this->seedToneLibraries($instruments);
        $sessions = $this->seedTuningSessions($instruments);
        $this->seedSpectrumData($sessions);
        $this->seedTuningSuggestions($sessions);
        $this->seedSessionVersions($sessions);
        $this->seedPracticeRecords($instruments, $sessions);
    }

    private function seedInstruments()
    {
        $data = [
            [
                'name' => '尺八',
                'type' => '管乐器',
                'origin' => '日本',
                'string_count' => 0,
                'tuning_notes' => ['D4', 'F4', 'G4', 'A4', 'C5', 'D5'],
                'description' => '日本传统竹制端吹管乐器，源自中国唐代尺八，音色苍凉深邃。基频约293.66Hz(D4)，泛音系列丰富且偏差较大是其特征。',
            ],
            [
                'name' => '冬不拉',
                'type' => '拨弦乐器',
                'origin' => '哈萨克斯坦',
                'string_count' => 2,
                'tuning_notes' => ['D3', 'A3'],
                'description' => '哈萨克族传统两弦弹拨乐器，琴身梨形，常用于独奏与伴奏。定弦为D3-A3，泛音偏差在冷热弦上差异明显。',
            ],
            [
                'name' => '箜篌',
                'type' => '拨弦乐器',
                'origin' => '中国',
                'string_count' => 36,
                'tuning_notes' => ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
                'description' => '中国古代拨弦乐器，现代雁柱箜篌有36弦，音域宽广近似竖琴。调弦复杂，弦间频率关系需严格校准。',
            ],
            [
                'name' => '马头琴',
                'type' => '拉弦乐器',
                'origin' => '蒙古',
                'string_count' => 2,
                'tuning_notes' => ['G3', 'C4'],
                'description' => '蒙古族传统两弦弓弦乐器，梯形琴箱，定弦G3-C4。因马尾弦材质特殊，泛音分布与普通弦乐显著不同。',
            ],
            [
                'name' => '西塔尔',
                'type' => '拨弦乐器',
                'origin' => '印度',
                'string_count' => 20,
                'tuning_notes' => ['C#3', 'F#3', 'G#3', 'C#4', 'G#4'],
                'description' => '印度古典音乐核心弹拨乐器，20弦中7根演奏弦、13根共鸣弦。共鸣弦调弦对主弦泛音产生交互影响，偏差模式极其复杂。',
            ],
            [
                'name' => '特雷门琴',
                'type' => '电子乐器',
                'origin' => '俄罗斯',
                'string_count' => 0,
                'tuning_notes' => ['连续频域'],
                'description' => '无需接触的电子乐器，双手在天线附近移动控制音高和音量。音高连续变化，基频范围约65Hz-1050Hz，泛音纯度极高但基频稳定性差。',
            ],
        ];

        $models = [];
        foreach ($data as $item) {
            $models[$item['name']] = Instrument::create($item);
        }
        return $models;
    }

    private function seedToneLibraries($instruments)
    {
        $libraryData = [
            '尺八' => [
                ['note_name' => 'D4', 'target_freq' => 293.66, 'tolerance_cents' => 15, 'description' => '筒音（全闭）基础音'],
                ['note_name' => 'F4', 'target_freq' => 349.23, 'tolerance_cents' => 12, 'description' => '第一孔开放'],
                ['note_name' => 'G4', 'target_freq' => 392.00, 'tolerance_cents' => 12, 'description' => '第二孔开放'],
                ['note_name' => 'A4', 'target_freq' => 440.00, 'tolerance_cents' => 10, 'description' => '第三孔开放'],
                ['note_name' => 'C5', 'target_freq' => 523.25, 'tolerance_cents' => 12, 'description' => '第四孔开放'],
                ['note_name' => 'D5', 'target_freq' => 587.33, 'tolerance_cents' => 15, 'description' => '五孔全开高音'],
            ],
            '冬不拉' => [
                ['note_name' => 'D3', 'target_freq' => 146.83, 'tolerance_cents' => 10, 'description' => '低音弦定弦'],
                ['note_name' => 'A3', 'target_freq' => 220.00, 'tolerance_cents' => 10, 'description' => '高音弦定弦'],
            ],
            '箜篌' => [
                ['note_name' => 'C4', 'target_freq' => 261.63, 'tolerance_cents' => 5, 'description' => '中央C参考弦'],
                ['note_name' => 'D4', 'target_freq' => 293.66, 'tolerance_cents' => 5, 'description' => 'D弦'],
                ['note_name' => 'E4', 'target_freq' => 329.63, 'tolerance_cents' => 5, 'description' => 'E弦'],
                ['note_name' => 'F4', 'target_freq' => 349.23, 'tolerance_cents' => 5, 'description' => 'F弦'],
                ['note_name' => 'G4', 'target_freq' => 392.00, 'tolerance_cents' => 5, 'description' => 'G弦'],
                ['note_name' => 'A4', 'target_freq' => 440.00, 'tolerance_cents' => 5, 'description' => 'A弦'],
                ['note_name' => 'B4', 'target_freq' => 493.88, 'tolerance_cents' => 5, 'description' => 'B弦'],
                ['note_name' => 'C5', 'target_freq' => 523.25, 'tolerance_cents' => 5, 'description' => '高八度C弦'],
            ],
            '马头琴' => [
                ['note_name' => 'G3', 'target_freq' => 196.00, 'tolerance_cents' => 12, 'description' => '低音弦'],
                ['note_name' => 'C4', 'target_freq' => 261.63, 'tolerance_cents' => 12, 'description' => '高音弦'],
            ],
            '西塔尔' => [
                ['note_name' => 'C#3', 'target_freq' => 138.59, 'tolerance_cents' => 8, 'description' => '主弦1'],
                ['note_name' => 'F#3', 'target_freq' => 185.00, 'tolerance_cents' => 8, 'description' => '主弦2'],
                ['note_name' => 'G#3', 'target_freq' => 207.65, 'tolerance_cents' => 8, 'description' => '主弦3'],
                ['note_name' => 'C#4', 'target_freq' => 277.18, 'tolerance_cents' => 8, 'description' => '主弦4'],
                ['note_name' => 'G#4', 'target_freq' => 415.30, 'tolerance_cents' => 8, 'description' => '主弦5'],
            ],
            '特雷门琴' => [
                ['note_name' => 'C2', 'target_freq' => 65.41, 'tolerance_cents' => 25, 'description' => '低频参考'],
                ['note_name' => 'A4', 'target_freq' => 440.00, 'tolerance_cents' => 20, 'description' => '中频参考'],
                ['note_name' => 'C6', 'target_freq' => 1046.50, 'tolerance_cents' => 25, 'description' => '高频参考'],
            ],
        ];

        foreach ($libraryData as $instrumentName => $tones) {
            $instrument = $instruments[$instrumentName];
            foreach ($tones as $tone) {
                ToneLibrary::create(array_merge($tone, ['instrument_id' => $instrument->id]));
            }
        }
    }

    private function seedTuningSessions($instruments)
    {
        $sessions = [];

        $s1 = TuningSession::create([
            'instrument_id' => $instruments['尺八']->id,
            'name' => '尺八-1.8尺-竹材校准',
            'audio_path' => null,
            'fundamental_freq' => 289.45,
            'status' => 'completed',
            'notes' => '竹材老化后基频偏低约4Hz，需通过口风角度补偿。泛音2/3有较大偏差。',
            'has_anomaly' => true,
            'anomaly_description' => '第3泛音偏差超过25音分，疑似竹节内壁不规则导致气流扰动。',
        ]);
        $sessions['尺八-1'] = $s1;

        $s2 = TuningSession::create([
            'instrument_id' => $instruments['冬不拉']->id,
            'name' => '冬不拉-新弦张力调试',
            'audio_path' => null,
            'fundamental_freq' => 147.20,
            'status' => 'in_progress',
            'notes' => '新换尼龙弦，张力尚未稳定，低音弦偏高0.37Hz。',
            'has_anomaly' => false,
            'anomaly_description' => null,
        ]);
        $sessions['冬不拉-1'] = $s2;

        $s3 = TuningSession::create([
            'instrument_id' => $instruments['箜篌']->id,
            'name' => '箜篌-36弦全弦校准',
            'audio_path' => null,
            'fundamental_freq' => 261.80,
            'status' => 'draft',
            'notes' => '36弦中已有12弦偏离目标超过5音分，需逐弦校准。',
            'has_anomaly' => true,
            'anomaly_description' => '第7弦和第22弦频率漂移严重（>30音分），可能因雁柱位移导致。',
        ]);
        $sessions['箜篌-1'] = $s3;

        $s4 = TuningSession::create([
            'instrument_id' => $instruments['马头琴']->id,
            'name' => '马头琴-马尾弦湿度响应',
            'audio_path' => null,
            'fundamental_freq' => 194.80,
            'status' => 'completed',
            'notes' => '湿度从40%升至70%后，马尾弦基频下降约1.2Hz。建议在湿度变化后等待30分钟再调弦。',
            'has_anomaly' => false,
            'anomaly_description' => null,
        ]);
        $sessions['马头琴-1'] = $s4;

        $s5 = TuningSession::create([
            'instrument_id' => $instruments['西塔尔']->id,
            'name' => '西塔尔-共鸣弦交互偏差分析',
            'audio_path' => null,
            'fundamental_freq' => 139.10,
            'status' => 'in_progress',
            'notes' => '13根共鸣弦中5根与主弦产生非预期共振，导致泛音偏差叠加。',
            'has_anomaly' => true,
            'anomaly_description' => '共鸣弦#7与主弦3的二次谐波重合，偏差叠加至+42音分，需重新调整共鸣弦频率。',
        ]);
        $sessions['西塔尔-1'] = $s5;

        $s6 = TuningSession::create([
            'instrument_id' => $instruments['特雷门琴']->id,
            'name' => '特雷门琴-天线灵敏度校准',
            'audio_path' => null,
            'fundamental_freq' => 442.30,
            'status' => 'completed',
            'notes' => '右手天线灵敏度校准后，A4偏差+2.3Hz，在可接受范围内。',
            'has_anomaly' => false,
            'anomaly_description' => null,
        ]);
        $sessions['特雷门琴-1'] = $s6;

        $s7 = TuningSession::create([
            'instrument_id' => $instruments['尺八']->id,
            'name' => '尺八-2.0尺-低音域测试',
            'audio_path' => null,
            'fundamental_freq' => 220.50,
            'status' => 'completed',
            'notes' => '2.0尺管长更长，基频降为A3附近，低音域共鸣丰满。',
            'has_anomaly' => false,
            'anomaly_description' => null,
        ]);
        $sessions['尺八-2'] = $s7;

        return $sessions;
    }

    private function seedSpectrumData($sessions)
    {
        $spectrums = [
            '尺八-1' => [
                [1, 289.45, 1.00, -4.21, false],
                [2, 578.90, 0.72, -4.21, false],
                [3, 870.35, 0.45, -7.83, true],
                [4, 1157.80, 0.31, -4.21, false],
                [5, 1449.25, 0.18, -3.52, false],
                [6, 1738.70, 0.12, -2.91, false],
                [7, 2030.15, 0.08, +1.34, false],
                [8, 2315.60, 0.05, -4.21, false],
            ],
            '冬不拉-1' => [
                [1, 147.20, 1.00, +0.37, false],
                [2, 294.40, 0.85, +0.37, false],
                [3, 441.60, 0.52, +0.37, false],
                [4, 588.80, 0.34, +0.37, false],
                [5, 736.00, 0.21, +0.37, false],
                [6, 883.20, 0.14, +0.37, false],
            ],
            '箜篌-1' => [
                [1, 261.80, 1.00, +0.17, false],
                [2, 523.60, 0.78, +0.17, false],
                [3, 785.40, 0.41, -2.45, false],
                [4, 1047.20, 0.28, +0.17, false],
                [5, 1312.50, 0.15, +8.34, true],
                [6, 1570.80, 0.09, +0.17, false],
            ],
            '马头琴-1' => [
                [1, 194.80, 1.00, -1.20, false],
                [2, 389.60, 0.68, -1.20, false],
                [3, 586.90, 0.42, +3.85, false],
                [4, 779.20, 0.27, -1.20, false],
                [5, 976.50, 0.16, +5.22, false],
                [6, 1168.80, 0.09, -1.20, false],
            ],
            '西塔尔-1' => [
                [1, 139.10, 1.00, +0.51, false],
                [2, 278.20, 0.80, +0.51, false],
                [3, 417.30, 0.55, +0.51, false],
                [4, 560.90, 0.38, +42.15, true],
                [5, 695.50, 0.25, +0.51, false],
                [6, 834.60, 0.15, +0.51, false],
                [7, 975.20, 0.08, +15.73, true],
            ],
            '特雷门琴-1' => [
                [1, 442.30, 1.00, +2.30, false],
                [2, 884.60, 0.92, +2.30, false],
                [3, 1326.90, 0.65, +2.30, false],
                [4, 1769.20, 0.38, +2.30, false],
            ],
            '尺八-2' => [
                [1, 220.50, 1.00, -0.50, false],
                [2, 441.00, 0.75, -0.50, false],
                [3, 661.50, 0.48, -0.50, false],
                [4, 882.00, 0.30, -0.50, false],
                [5, 1102.50, 0.18, -0.50, false],
            ],
        ];

        foreach ($spectrums as $sessionKey => $data) {
            $session = $sessions[$sessionKey];
            foreach ($data as $item) {
                SpectrumData::create([
                    'tuning_session_id' => $session->id,
                    'harmonic_order' => $item[0],
                    'frequency' => $item[1],
                    'amplitude' => $item[2],
                    'deviation_cents' => $item[3],
                    'is_anomaly' => $item[4],
                ]);
            }
        }
    }

    private function seedTuningSuggestions($sessions)
    {
        $suggestions = [
            '尺八-1' => [
                [1, 289.45, 293.66, -4.21, 'compensate', '通过口风角度上抬补偿基频偏低，实际演奏中约可提升3-5Hz'],
                [2, 578.90, 587.32, -4.21, 'compensate', '二次泛音跟随基频偏差，口风补偿可同步修正'],
                [3, 870.35, 880.98, -7.83, 'note', '第三泛音偏差过大，建议录制后进行数字修正或更换管段'],
            ],
            '冬不拉-1' => [
                [1, 147.20, 146.83, +0.37, 'wait', '新弦张力尚未稳定，等待24小时后复测'],
                [2, 220.15, 220.00, +0.15, 'wait', '高音弦偏差极小，等待稳定后确认'],
            ],
            '箜篌-1' => [
                [1, 261.80, 261.63, +0.17, 'adjust', 'C4弦微调，弦轴顺时针旋约2度'],
                [7, 252.30, 261.63, -31.45, 'adjust', '第7弦偏差严重，需检查雁柱位置后重新调弦'],
                [22, 248.70, 261.63, -35.82, 'adjust', '第22弦同样严重偏低，检查雁柱是否松动位移'],
            ],
            '马头琴-1' => [
                [1, 194.80, 196.00, -1.20, 'adjust', '低音弦受湿度影响偏低，旋紧弦轴补偿1.2Hz'],
                [2, 260.43, 261.63, -1.20, 'adjust', '高音弦同步偏低，微调即可'],
            ],
            '西塔尔-1' => [
                [3, 207.10, 207.65, -0.55, 'adjust', '主弦3微调即可'],
                [7, 205.30, 207.65, -15.73, 'adjust', '共鸣弦#7与主弦3二次谐波重合，需降低约16音分'],
                [4, 560.90, 554.36, +42.15, 'adjust', '第4泛音严重偏高，调整共鸣弦#7后应可消除共振叠加'],
            ],
            '特雷门琴-1' => [
                [1, 442.30, 440.00, +2.30, 'adjust', '右手天线位置微调，向身体方向靠近约2mm'],
            ],
            '尺八-2' => [
                [1, 220.50, 220.00, -0.50, 'compensate', '偏差极小，口风微调即可'],
            ],
        ];

        foreach ($suggestions as $sessionKey => $data) {
            $session = $sessions[$sessionKey];
            foreach ($data as $item) {
                TuningSuggestion::create([
                    'tuning_session_id' => $session->id,
                    'string_index' => $item[0],
                    'current_freq' => $item[1],
                    'target_freq' => $item[2],
                    'adjustment_cents' => $item[3],
                    'action' => $item[4],
                    'note' => $item[5],
                ]);
            }
        }
    }

    private function seedSessionVersions($sessions)
    {
        $service = app(\App\Services\SpectrumAnalyzerService::class);

        $versions = [
            '尺八-1' => [
                ['initial_only', '初始录制'],
                ['with_spectrum', '频谱分析完成，标记异常'],
                ['full', '调弦建议生成，分析完成'],
            ],
            '冬不拉-1' => [
                ['initial_only', '换弦后首次测量'],
                ['with_spectrum', '频谱分析完成，新弦张力不稳定'],
            ],
            '箜篌-1' => [
                ['initial_only', '创建校准任务'],
                ['with_spectrum', '初检完成，标记12根偏差弦'],
                ['full', '异常弦详细分析完成，待调整'],
            ],
            '马头琴-1' => [
                ['initial_only', '湿度40%基准测量'],
                ['with_spectrum', '湿度70%复测，记录偏移曲线'],
                ['full', '分析完成，建议湿度变化后等待30分钟'],
            ],
            '西塔尔-1' => [
                ['initial_only', '初始共鸣弦状态记录'],
                ['with_spectrum', '频谱分析完成，发现共振异常'],
                ['full', '标记#7弦共振偏差，建议调整'],
            ],
            '特雷门琴-1' => [
                ['initial_only', '出厂默认状态'],
                ['full', '灵敏度校准完成，偏差+2.3Hz，在可接受范围内'],
            ],
            '尺八-2' => [
                ['full', '首次录制，低音域分析完成'],
            ],
        ];

        foreach ($versions as $sessionKey => $versionDefs) {
            $session = $sessions[$sessionKey];
            $originalSpectrum = $session->spectrumData()->get()->toArray();
            $originalSuggestions = $session->tuningSuggestions()->get()->toArray();

            foreach ($versionDefs as $idx => $def) {
                $session->spectrumData()->delete();
                $session->tuningSuggestions()->delete();

                if ($def[0] !== 'initial_only') {
                    foreach ($originalSpectrum as $sd) {
                        unset($sd['id'], $sd['tuning_session_id'], $sd['created_at'], $sd['updated_at']);
                        $session->spectrumData()->create($sd);
                    }
                }

                if ($def[0] === 'full') {
                    foreach ($originalSuggestions as $sg) {
                        unset($sg['id'], $sg['tuning_session_id'], $sg['created_at'], $sg['updated_at']);
                        $session->tuningSuggestions()->create($sg);
                    }
                }

                $session->fresh();
                $session->createVersion($def[1]);
            }

            $session->spectrumData()->delete();
            $session->tuningSuggestions()->delete();
            foreach ($originalSpectrum as $sd) {
                unset($sd['id'], $sd['tuning_session_id'], $sd['created_at'], $sd['updated_at']);
                $session->spectrumData()->create($sd);
            }
            foreach ($originalSuggestions as $sg) {
                unset($sg['id'], $sg['tuning_session_id'], $sg['created_at'], $sg['updated_at']);
                $session->tuningSuggestions()->create($sg);
            }
        }
    }

    private function seedPracticeRecords($instruments, $sessions)
    {
        $records = [
            ['instrument' => '尺八', 'session' => '尺八-1', 'date' => '2024-05-10', 'duration' => 45, 'score' => 72.5, 'notes' => '初次调音，泛音控制不佳'],
            ['instrument' => '尺八', 'session' => '尺八-1', 'date' => '2024-05-12', 'duration' => 60, 'score' => 78.3, 'notes' => '口风补偿技巧有进步'],
            ['instrument' => '尺八', 'session' => '尺八-2', 'date' => '2024-05-15', 'duration' => 30, 'score' => 80.1, 'notes' => '低音域练习，2.0尺更稳定'],
            ['instrument' => '尺八', 'session' => '尺八-2', 'date' => '2024-05-18', 'duration' => 55, 'score' => 83.7, 'notes' => '持续进步，偏差控制在10音分内'],
            ['instrument' => '尺八', 'session' => '尺八-2', 'date' => '2024-05-22', 'duration' => 50, 'score' => 86.2, 'notes' => '接近目标精度'],
            ['instrument' => '尺八', 'session' => null, 'date' => '2024-05-25', 'duration' => 40, 'score' => 88.5, 'notes' => '自由练习，精度提升明显'],
            ['instrument' => '冬不拉', 'session' => '冬不拉-1', 'date' => '2024-05-11', 'duration' => 35, 'score' => 68.0, 'notes' => '新弦不稳定，调弦困难'],
            ['instrument' => '冬不拉', 'session' => '冬不拉-1', 'date' => '2024-05-14', 'duration' => 50, 'score' => 75.4, 'notes' => '弦张力趋稳'],
            ['instrument' => '冬不拉', 'session' => null, 'date' => '2024-05-20', 'duration' => 45, 'score' => 81.0, 'notes' => '双弦协调改善'],
            ['instrument' => '箜篌', 'session' => '箜篌-1', 'date' => '2024-05-13', 'duration' => 90, 'score' => 55.2, 'notes' => '36弦全调极耗精力，偏差弦较多'],
            ['instrument' => '箜篌', 'session' => '箜篌-1', 'date' => '2024-05-17', 'duration' => 80, 'score' => 62.8, 'notes' => '逐弦校准中，异常弦先处理'],
            ['instrument' => '箜篌', 'session' => '箜篌-1', 'date' => '2024-05-21', 'duration' => 75, 'score' => 70.5, 'notes' => '雁柱修复后偏差弦减少'],
            ['instrument' => '马头琴', 'session' => '马头琴-1', 'date' => '2024-05-09', 'duration' => 40, 'score' => 76.0, 'notes' => '湿度响应练习'],
            ['instrument' => '马头琴', 'session' => '马头琴-1', 'date' => '2024-05-16', 'duration' => 55, 'score' => 82.3, 'notes' => '等待时间掌握后精度提升'],
            ['instrument' => '马头琴', 'session' => null, 'date' => '2024-05-23', 'duration' => 45, 'score' => 87.1, 'notes' => '弓弦配合进步'],
            ['instrument' => '西塔尔', 'session' => '西塔尔-1', 'date' => '2024-05-08', 'duration' => 70, 'score' => 52.3, 'notes' => '共鸣弦交互复杂，调弦困难'],
            ['instrument' => '西塔尔', 'session' => '西塔尔-1', 'date' => '2024-05-19', 'duration' => 65, 'score' => 60.1, 'notes' => '开始理解共振叠加机制'],
            ['instrument' => '西塔尔', 'session' => null, 'date' => '2024-05-24', 'duration' => 60, 'score' => 65.8, 'notes' => '共鸣弦调整后主弦偏差减少'],
            ['instrument' => '特雷门琴', 'session' => '特雷门琴-1', 'date' => '2024-05-07', 'duration' => 30, 'score' => 70.0, 'notes' => '天线灵敏度校准练习'],
            ['instrument' => '特雷门琴', 'session' => '特雷门琴-1', 'date' => '2024-05-14', 'duration' => 40, 'score' => 77.5, 'notes' => '手部位置稳定性提升'],
        ];

        foreach ($records as $record) {
            $instrument = $instruments[$record['instrument']];
            $session = $record['session'] ? $sessions[$record['session']] : null;

            PracticeRecord::create([
                'instrument_id' => $instrument->id,
                'tuning_session_id' => $session?->id,
                'session_date' => $record['date'],
                'duration_minutes' => $record['duration'],
                'accuracy_score' => $record['score'],
                'notes' => $record['notes'],
            ]);
        }
    }
}
