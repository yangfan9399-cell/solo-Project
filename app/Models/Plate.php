<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Plate extends Model
{
    use HasFactory;

    protected $fillable = [
        'plate_code',
        'pattern_name',
        'pattern_description',
        'applicable_books',
        'plate_width',
        'plate_height',
        'plate_thickness',
        'material',
        'usage_count',
        'max_usage',
        'status',
        'location',
        'manufacture_date',
        'last_used_at',
        'next_maintenance_date',
        'remark',
    ];

    protected $casts = [
        'plate_width' => 'decimal:2',
        'plate_height' => 'decimal:2',
        'plate_thickness' => 'decimal:2',
        'manufacture_date' => 'date',
        'last_used_at' => 'datetime',
        'next_maintenance_date' => 'date',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function versionHistories(): HasMany
    {
        return $this->hasMany(VersionHistory::class)->orderBy('changed_at', 'desc');
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(Maintenance::class)->orderBy('maintenance_date', 'desc');
    }

    public function getUsageRateAttribute(): float
    {
        if ($this->max_usage <= 0) return 0;
        return min(100, round(($this->usage_count / $this->max_usage) * 100, 1));
    }

    public function getPlateSizeAttribute(): string
    {
        return "{$this->plate_width} × {$this->plate_height} × {$this->plate_thickness} mm";
    }

    public function getApplicableBooksArrayAttribute(): array
    {
        $books = preg_split('/[,，、;；\n\r]+/', $this->applicable_books);
        return array_values(array_filter(array_map('trim', $books)));
    }

    public function getIsOverdueMaintenanceAttribute(): bool
    {
        if (!$this->next_maintenance_date) return false;
        return Carbon::today()->gt($this->next_maintenance_date);
    }

    public function getIsHighUsageAttribute(): bool
    {
        return $this->usage_rate >= 85;
    }

    public function getIsOverUsageAttribute(): bool
    {
        return $this->usage_count > $this->max_usage;
    }

    public function getUsageLevelAttribute(): string
    {
        if ($this->usage_count > $this->max_usage) return 'danger';
        if ($this->usage_rate >= 85) return 'warn';
        return 'normal';
    }

    public function getIsWarningAttribute(): bool
    {
        return $this->is_overdue_maintenance || $this->is_high_usage || in_array($this->status, ['待保养', '维修中', '待审批', '已驳回']);
    }

    public function getIsRetiredAttribute(): bool
    {
        return in_array($this->status, ['已报废', '已归档']);
    }

    public function getCanEditAttribute(): bool
    {
        return !in_array($this->status, ['已报废', '已归档']);
    }

    public function getCanSubmitApprovalAttribute(): bool
    {
        return $this->status === '正常';
    }

    public function getCanApproveAttribute(): bool
    {
        return $this->status === '待审批';
    }

    public function getCanArchiveAttribute(): bool
    {
        return in_array($this->status, ['正常', '待保养']);
    }

    public function getCanReactivateAttribute(): bool
    {
        return $this->status === '已归档';
    }

    public function getStatusBadgeClassAttribute(): string
    {
        return match ($this->status) {
            '正常' => 'badge-success',
            '待保养' => 'badge-warning',
            '维修中' => 'badge-info',
            '待审批' => 'badge-primary',
            '已驳回' => 'badge-danger',
            '待归档' => 'badge-info',
            '已归档' => 'badge-secondary',
            '已报废' => 'badge-secondary',
            default => 'badge-secondary',
        };
    }

    public function getWarningTagsAttribute(): array
    {
        $tags = [];
        if ($this->is_retired) return $tags;
        if ($this->is_overdue_maintenance) $tags[] = ['⏰ 保养逾期', 'danger'];
        if ($this->is_over_usage) $tags[] = ['🔥 超期使用', 'danger'];
        elseif ($this->is_high_usage) $tags[] = ['⚡ 高频使用', 'warning'];
        if ($this->status === '待保养') $tags[] = ['🔧 待保养', 'warning'];
        if ($this->status === '维修中') $tags[] = ['🛠 维修中', 'info'];
        if ($this->status === '待审批') $tags[] = ['📝 待审批', 'primary'];
        if ($this->status === '已驳回') $tags[] = ['❌ 已驳回', 'danger'];
        return $tags;
    }

    public function getMaintenanceDaysLeftAttribute(): ?int
    {
        if (!$this->next_maintenance_date) return null;
        return Carbon::today()->diffInDays($this->next_maintenance_date, false);
    }

    public function getMaintenanceStatusTextAttribute(): string
    {
        if ($this->is_retired || !$this->next_maintenance_date) return '—';
        $days = $this->maintenance_days_left;
        if ($days < 0) return '逾期 ' . abs($days) . ' 天';
        if ($days == 0) return '今日到期';
        if ($days <= 7) return "{$days} 天后";
        return $this->next_maintenance_date->format('Y-m-d');
    }

    public function scopeActive($query)
    {
        return $query->whereNotIn('status', ['已报废']);
    }

    public function scopeWarning($query)
    {
        $today = Carbon::today()->toDateString();
        return $query->where(function ($q) use ($today) {
            $q->whereColumn('usage_count', '>=', \DB::raw('max_usage * 0.85'))
                ->orWhere(function ($q2) use ($today) {
                    $q2->whereDate('next_maintenance_date', '<', $today)
                        ->whereNotNull('next_maintenance_date');
                })
                ->orWhereIn('status', ['待保养', '维修中']);
        })->whereNotIn('status', ['已报废']);
    }

    public function scopeNormal($query)
    {
        return $query->where('status', '正常');
    }

    public static function getStatusOptions(): array
    {
        return ['正常', '待保养', '维修中', '待审批', '已驳回', '待归档', '已归档', '已报废'];
    }

    public static function getEditableStatusOptions(): array
    {
        return ['正常', '待保养', '维修中', '待审批', '已驳回', '待归档'];
    }

    public static function getMaterialOptions(): array
    {
        return ['黄铜', '锌版', '镁版', '铜锌合金', '不锈钢'];
    }

    public function getNextStatusTransitionsAttribute(): array
    {
        $transitions = [
            '正常' => [
                ['target' => '待审批', 'label' => '📝 提交审批', 'class' => 'btn-primary'],
                ['target' => '待保养', 'label' => '🔧 标记待保养', 'class' => 'btn-warning'],
                ['target' => '待归档', 'label' => '📦 申请归档', 'class' => 'btn-info'],
            ],
            '待审批' => [
                ['target' => '正常', 'label' => '✅ 审批通过', 'class' => 'btn-success'],
                ['target' => '已驳回', 'label' => '❌ 审批驳回', 'class' => 'btn-danger'],
            ],
            '已驳回' => [
                ['target' => '正常', 'label' => '🔄 修改后重提', 'class' => 'btn-primary'],
            ],
            '待保养' => [
                ['target' => '正常', 'label' => '✅ 保养完成', 'class' => 'btn-success'],
                ['target' => '维修中', 'label' => '🛠 送修', 'class' => 'btn-info'],
            ],
            '维修中' => [
                ['target' => '正常', 'label' => '✅ 修复完成', 'class' => 'btn-success'],
                ['target' => '已报废', 'label' => '🗑 报废处理', 'class' => 'btn-danger'],
            ],
            '待归档' => [
                ['target' => '已归档', 'label' => '📦 确认归档', 'class' => 'btn-secondary'],
                ['target' => '正常', 'label' => '↩️ 撤回归档', 'class' => 'btn-secondary'],
            ],
            '已归档' => [
                ['target' => '正常', 'label' => '↩️ 启封复用', 'class' => 'btn-primary'],
            ],
            '已报废' => [],
        ];
        return $transitions[$this->status] ?? [];
    }
}
