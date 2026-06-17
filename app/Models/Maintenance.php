<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maintenance extends Model
{
    use HasFactory;

    protected $fillable = [
        'plate_id',
        'maintenance_type',
        'description',
        'operator',
        'maintenance_date',
        'next_maintenance_date',
        'cost',
        'status',
        'remark',
    ];

    protected $casts = [
        'maintenance_date' => 'date',
        'next_maintenance_date' => 'date',
        'cost' => 'decimal:2',
    ];

    public function plate(): BelongsTo
    {
        return $this->belongsTo(Plate::class);
    }

    public function getMaintenanceTypeBadgeClassAttribute(): string
    {
        return match ($this->maintenance_type) {
            '日常清洁' => 'bg-sky-100 text-sky-800',
            '防锈处理' => 'bg-slate-100 text-slate-800',
            '抛光修复' => 'bg-amber-100 text-amber-800',
            '图案修复' => 'bg-purple-100 text-purple-800',
            '深度保养' => 'bg-emerald-100 text-emerald-800',
            '更换重做' => 'bg-rose-100 text-rose-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }

    public function getStatusBadgeClassAttribute(): string
    {
        return match ($this->status) {
            '已完成' => 'bg-green-100 text-green-800',
            '进行中' => 'bg-blue-100 text-blue-800',
            '待处理' => 'bg-yellow-100 text-yellow-800',
            '已取消' => 'bg-gray-100 text-gray-800',
            default => 'bg-gray-100 text-gray-800',
        };
    }
}
