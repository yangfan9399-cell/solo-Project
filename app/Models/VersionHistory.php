<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VersionHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'plate_id',
        'version_code',
        'batch_number',
        'change_type',
        'change_description',
        'operator',
        'changed_at',
        'plate_width',
        'plate_height',
        'material',
        'snapshot_data',
    ];

    protected $casts = [
        'changed_at' => 'datetime',
        'plate_width' => 'decimal:2',
        'plate_height' => 'decimal:2',
        'snapshot_data' => 'array',
    ];

    public function plate(): BelongsTo
    {
        return $this->belongsTo(Plate::class);
    }

    public function getChangeTypeBadgeClassAttribute(): string
    {
        return match ($this->change_type) {
            '初始创建' => 'badge-success',
            '图案修改' => 'badge-purple',
            '尺寸调整' => 'badge-info',
            '材质更换' => 'badge-gold',
            '修复重做' => 'badge-danger',
            '维护记录' => 'badge-teal',
            '提交审批' => 'badge-primary',
            '审批通过' => 'badge-success',
            '审批驳回' => 'badge-danger',
            '申请归档' => 'badge-info',
            '确认归档' => 'badge-secondary',
            '启封复用' => 'badge-primary',
            '冲突保留' => 'badge-warning',
            default => 'badge-secondary',
        };
    }

    public function getChangeTypeIconAttribute(): string
    {
        return match ($this->change_type) {
            '初始创建' => '✨',
            '图案修改' => '🎨',
            '尺寸调整' => '📐',
            '材质更换' => '🔄',
            '修复重做' => '🔧',
            '维护记录' => '🛡️',
            '提交审批' => '📝',
            '审批通过' => '✅',
            '审批驳回' => '❌',
            '申请归档' => '📦',
            '确认归档' => '📥',
            '启封复用' => '📤',
            '冲突保留' => '⚠️',
            default => '📝',
        };
    }

    public function getChangesSummaryAttribute(): array
    {
        if (empty($this->snapshot_data) || !is_array($this->snapshot_data)) return [];
        $result = [];
        $fieldLabels = [
            'plate_code' => '版号',
            'pattern_name' => '图案名称',
            'pattern_description' => '图案描述',
            'applicable_books' => '适用书名',
            'plate_width' => '宽度',
            'plate_height' => '高度',
            'plate_thickness' => '厚度',
            'material' => '材质',
            'usage_count' => '使用次数',
            'max_usage' => '寿命上限',
            'status' => '状态',
            'location' => '存放位置',
            'manufacture_date' => '制作日期',
            'next_maintenance_date' => '下次保养',
            'remark' => '备注',
        ];
        foreach ($this->snapshot_data['changed_fields'] ?? [] as $field) {
            $label = $fieldLabels[$field] ?? $field;
            $before = $this->snapshot_data['before'][$field] ?? null;
            $after = $this->snapshot_data['after'][$field] ?? null;
            if ($before !== null || $after !== null) {
                $result[] = [
                    'label' => $label,
                    'before' => $before,
                    'after' => $after,
                ];
            }
        }
        return $result;
    }
}
