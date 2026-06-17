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
            '初始创建' => 'bg-emerald-100 text-emerald-800',
            '图案修改' => 'bg-purple-100 text-purple-800',
            '尺寸调整' => 'bg-indigo-100 text-indigo-800',
            '材质更换' => 'bg-amber-100 text-amber-800',
            '修复重做' => 'bg-rose-100 text-rose-800',
            '维护记录' => 'bg-teal-100 text-teal-800',
            default => 'bg-gray-100 text-gray-800',
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
            default => '📝',
        };
    }
}
