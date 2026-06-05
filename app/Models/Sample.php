<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sample extends Model
{
    protected $fillable = [
        'sample_number',
        'product_name',
        'origin',
        'batch_number',
        'production_date',
        'quantity',
        'unit',
        'sample_source',
        'evidence_photos',
        'sampler_id',
        'status',
        'conflict_note',
        'conflict_sample_id',
    ];

    protected $casts = [
        'production_date' => 'date',
        'evidence_photos' => 'array',
        'quantity' => 'decimal:2',
    ];

    protected $appends = [
        'status_name',
        'status_color',
        'can_be_disposed',
        'has_conflict',
    ];

    const STATUS_REGISTERED = 'registered';
    const STATUS_TESTING = 'testing';
    const STATUS_QUALIFIED = 'qualified';
    const STATUS_UNQUALIFIED = 'unqualified';
    const STATUS_PROCESSING = 'processing';
    const STATUS_REINSPECTION_APPLIED = 'reinspection_applied';
    const STATUS_RETURNED = 'returned';
    const STATUS_ARCHIVED = 'archived';

    public function sampler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sampler_id');
    }

    public function inspectionResult(): HasOne
    {
        return $this->hasOne(InspectionResult::class);
    }

    public function inspectionResults(): HasMany
    {
        return $this->hasMany(InspectionResult::class);
    }

    public function disposal(): HasOne
    {
        return $this->hasOne(Disposal::class);
    }

    public function reinspectionRequests(): HasMany
    {
        return $this->hasMany(ReinspectionRequest::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(StatusHistory::class)->orderBy('created_at', 'desc');
    }

    public function conflictSample(): BelongsTo
    {
        return $this->belongsTo(Sample::class, 'conflict_sample_id');
    }

    public function conflictingSamples(): HasMany
    {
        return $this->hasMany(Sample::class, 'conflict_sample_id');
    }

    public function getStatusNameAttribute()
    {
        return match ($this->status) {
            self::STATUS_REGISTERED => '已登记',
            self::STATUS_TESTING => '检测中',
            self::STATUS_QUALIFIED => '合格',
            self::STATUS_UNQUALIFIED => '不合格',
            self::STATUS_PROCESSING => '处置中',
            self::STATUS_REINSPECTION_APPLIED => '复检申请中',
            self::STATUS_RETURNED => '已退回',
            self::STATUS_ARCHIVED => '已归档',
            default => '未知',
        };
    }

    public function getStatusColorAttribute()
    {
        return match ($this->status) {
            self::STATUS_REGISTERED => 'blue',
            self::STATUS_TESTING => 'yellow',
            self::STATUS_QUALIFIED => 'green',
            self::STATUS_UNQUALIFIED => 'red',
            self::STATUS_PROCESSING => 'orange',
            self::STATUS_REINSPECTION_APPLIED => 'purple',
            self::STATUS_RETURNED => 'gray',
            self::STATUS_ARCHIVED => 'gray',
            default => 'gray',
        };
    }

    public function hasConflict()
    {
        return !is_null($this->conflict_sample_id) || $this->conflictingSamples()->exists();
    }

    public function getHasConflictAttribute()
    {
        return $this->hasConflict();
    }

    public function canBeDisposed()
    {
        if ($this->hasConflict()) {
            return false;
        }
        return in_array($this->status, [self::STATUS_UNQUALIFIED, self::STATUS_PROCESSING]);
    }

    public function getCanBeDisposedAttribute()
    {
        return $this->canBeDisposed();
    }
}
