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

    public function getIsWarningAttribute(): bool
    {
        return $this->is_overdue_maintenance || $this->is_high_usage || $this->status === '待保养' || $this->status === '维修中';
    }

    public function getMaintenanceDaysLeftAttribute(): ?int
    {
        if (!$this->next_maintenance_date) return null;
        return Carbon::today()->diffInDays($this->next_maintenance_date, false);
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
                ->orWhereDate('next_maintenance_date', '<', $today)
                ->orWhereIn('status', ['待保养', '维修中']);
        });
    }

    public function scopeNormal($query)
    {
        return $query->where('status', '正常');
    }
}
