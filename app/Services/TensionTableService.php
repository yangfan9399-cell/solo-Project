<?php

namespace App\Services;

use App\Models\DrumMasterRecord;
use App\Models\TensionTable;
use App\Models\TensionHistoryRecord;

class TensionTableService
{
    protected string $material;
    protected float $diameter;
    protected float $density;
    protected array $materialParams = [
        '牛皮' => ['density' => 0.92, 'elastic_modulus' => 2.5e6, 'damping' => 0.02],
        '羊皮' => ['density' => 0.88, 'elastic_modulus' => 2.0e6, 'damping' => 0.015],
        '合成皮' => ['density' => 1.05, 'elastic_modulus' => 3.0e6, 'damping' => 0.01],
    ];

    public function calculateFrequency(float $tension, float $diameter, string $material = '牛皮'): float
    {
        $params = $this->materialParams[$material] ?? $this->materialParams['牛皮'];
        $density = $params['density'];
        
        $diameterMeters = $diameter * 0.0254;
        $tensionPerUnitLength = $tension / $diameterMeters;
        
        $frequency = (1 / (2 * $diameterMeters)) * sqrt($tensionPerUnitLength / $density);
        
        return round($frequency, 2);
    }

    public function calculateTension(float $frequency, float $diameter, string $material = '牛皮'): float
    {
        $params = $this->materialParams[$material] ?? $this->materialParams['牛皮'];
        $density = $params['density'];
        
        $diameterMeters = $diameter * 0.0254;
        
        $tensionPerUnitLength = $frequency * 2 * $diameterMeters;
        $tensionPerUnitLength = $tensionPerUnitLength * $tensionPerUnitLength * $density;
        
        $tension = $tensionPerUnitLength * $diameterMeters;
        
        return round($tension, 2);
    }

    public function generateTensionTable(
        DrumMasterRecord $master,
        string $tableName,
        array $options = []
    ): array {
        $diameter = $master->drum_diameter;
        $detail = $master->detailRecords->first();
        $material = $detail?->drumhead_material ?? '牛皮';
        
        $minTension = $options['min_tension'] ?? 100;
        $maxTension = $options['max_tension'] ?? 500;
        $pointCount = $options['point_count'] ?? 10;
        
        $tableData = [];
        $tensionStep = ($maxTension - $minTension) / ($pointCount - 1);
        
        for ($i = 0; $i < $pointCount; $i++) {
            $tension = $minTension + $tensionStep * $i;
            $frequency = $this->calculateFrequency($tension, $diameter, $material);
            
            $targetFreq = $options['target_frequency'] ?? null;
            $deviation = $targetFreq ? round($frequency - $targetFreq, 3) : 0;
            
            $tableData[] = [
                'measurement_point' => $i + 1,
                'tension_value' => round($tension, 2),
                'frequency' => $frequency,
                'deviation' => $deviation,
            ];
        }
        
        return $tableData;
    }

    public function saveTensionTable(
        DrumMasterRecord $master,
        string $tableName,
        array $tableData,
        array $options = []
    ): void {
        $version = $options['version'] ?? '1.0';
        $note = $options['note'] ?? null;
        
        $currentMaxVersion = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->max('table_version');
        
        if ($currentMaxVersion) {
            $versionParts = explode('.', $currentMaxVersion);
            $versionParts[count($versionParts) - 1]++;
            $version = implode('.', $versionParts);
        }
        
        foreach ($tableData as $row) {
            TensionTable::create([
                'drum_master_record_id' => $master->id,
                'table_name' => $tableName,
                'table_version' => $version,
                'measurement_point' => $row['measurement_point'],
                'tension_value' => $row['tension_value'],
                'frequency' => $row['frequency'],
                'deviation' => $row['deviation'] ?? 0,
                'calculation_note' => $note,
            ]);
        }
    }

    public function rollbackTensionTable(
        DrumMasterRecord $master,
        string $tableName,
        string $targetVersion
    ): bool {
        $targetTable = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('table_version', $targetVersion)
            ->where('is_rollback', false)
            ->first();
        
        if (!$targetTable) {
            return false;
        }
        
        $currentTables = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('is_rollback', false)
            ->get();
        
        foreach ($currentTables as $table) {
            $table->update([
                'is_rollback' => true,
                'rollback_from_id' => $targetTable->id,
            ]);
        }
        
        $targetRecords = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('table_version', $targetVersion)
            ->where('is_rollback', true)
            ->get();
        
        $newVersion = $this->incrementVersion($targetVersion);
        foreach ($targetRecords as $record) {
            TensionTable::create([
                'drum_master_record_id' => $master->id,
                'table_name' => $tableName,
                'table_version' => $newVersion,
                'measurement_point' => $record->measurement_point,
                'tension_value' => $record->tension_value,
                'frequency' => $record->frequency,
                'deviation' => $record->deviation,
                'is_rollback' => false,
                'rollback_from_id' => $record->id,
                'calculation_note' => "回滚至版本 {$targetVersion}",
            ]);
        }
        
        return true;
    }

    public function recalculateTensionTable(
        DrumMasterRecord $master,
        string $tableName,
        array $newParams
    ): array {
        $currentTable = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('is_rollback', false)
            ->orderBy('table_version', 'desc')
            ->first();
        
        if (!$currentTable) {
            return ['success' => false, 'message' => '未找到张力表'];
        }
        
        $oldData = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('table_version', $currentTable->table_version)
            ->where('is_rollback', false)
            ->get();
        
        $newDiameter = $newParams['drum_diameter'] ?? $master->drum_diameter;
        $newMaterial = $newParams['drumhead_material'] ?? '牛皮';
        $targetFreq = $newParams['target_frequency'] ?? null;
        
        $newTableData = [];
        foreach ($oldData as $row) {
            $newFreq = $this->calculateFrequency($row->tension_value, $newDiameter, $newMaterial);
            $deviation = $targetFreq ? round($newFreq - $targetFreq, 3) : 0;
            
            $newTableData[] = [
                'measurement_point' => $row->measurement_point,
                'tension_value' => $row->tension_value,
                'frequency' => $newFreq,
                'deviation' => $deviation,
            ];
        }
        
        $newVersion = $this->incrementVersion($currentTable->table_version);
        
        foreach ($oldData as $row) {
            $row->update(['is_rollback' => true]);
        }
        
        foreach ($newTableData as $row) {
            TensionTable::create([
                'drum_master_record_id' => $master->id,
                'table_name' => $tableName,
                'table_version' => $newVersion,
                'measurement_point' => $row['measurement_point'],
                'tension_value' => $row['tension_value'],
                'frequency' => $row['frequency'],
                'deviation' => $row['deviation'],
                'calculation_note' => '参数变更重算',
            ]);
        }
        
        return [
            'success' => true,
            'new_version' => $newVersion,
            'data' => $newTableData,
        ];
    }

    protected function incrementVersion(string $version): string
    {
        $parts = explode('.', $version);
        $lastIndex = count($parts) - 1;
        $parts[$lastIndex] = (int)$parts[$lastIndex] + 1;
        return implode('.', $parts);
    }

    public function getTableVersions(DrumMasterRecord $master, string $tableName): array
    {
        return TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->distinct()
            ->orderBy('table_version')
            ->pluck('table_version')
            ->toArray();
    }

    public function compareVersions(
        DrumMasterRecord $master,
        string $tableName,
        string $version1,
        string $version2
    ): array {
        $table1 = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('table_version', $version1)
            ->orderBy('measurement_point')
            ->get();
        
        $table2 = TensionTable::where('drum_master_record_id', $master->id)
            ->where('table_name', $tableName)
            ->where('table_version', $version2)
            ->orderBy('measurement_point')
            ->get();
        
        $comparison = [];
        $maxPoints = max($table1->count(), $table2->count());
        
        for ($i = 0; $i < $maxPoints; $i++) {
            $row1 = $table1[$i] ?? null;
            $row2 = $table2[$i] ?? null;
            
            $comparison[] = [
                'point' => $i + 1,
                'tension_v1' => $row1?->tension_value,
                'tension_v2' => $row2?->tension_value,
                'tension_diff' => $row1 && $row2 ? round($row2->tension_value - $row1->tension_value, 2) : null,
                'freq_v1' => $row1?->frequency,
                'freq_v2' => $row2?->frequency,
                'freq_diff' => $row1 && $row2 ? round($row2->frequency - $row1->frequency, 2) : null,
            ];
        }
        
        return $comparison;
    }
}
