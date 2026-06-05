<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class WasteBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_number',
        'waste_category_id',
        'storage_location_id',
        'weight',
        'description',
        'production_date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'weight' => 'decimal:2',
        'production_date' => 'date',
    ];

    public function wasteCategory(): BelongsTo
    {
        return $this->belongsTo(WasteCategory::class);
    }

    public function storageLocation(): BelongsTo
    {
        return $this->belongsTo(StorageLocation::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function transferRequest(): HasOne
    {
        return $this->hasOne(TransferRequest::class);
    }

    public function processHistories(): MorphMany
    {
        return $this->morphMany(ProcessHistory::class, 'processable');
    }

    public function isWeightOverLimit(): bool
    {
        return $this->wasteCategory->isWeightOverLimit($this->weight);
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'stored' => '已暂存',
            'requested' => '已申请转运',
            'manifest_verified' => '联单已确认',
            'approved' => '已放行',
            'rejected' => '已退回',
            'archived' => '已归档',
        ];

        return $labels[$this->status] ?? $this->status;
    }
}
