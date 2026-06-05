<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class TransferRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'request_number',
        'waste_batch_id',
        'carrier_id',
        'planned_transfer_date',
        'destination',
        'receiver_unit',
        'status',
        'is_weight_over_limit',
        'weight_remark',
        'created_by',
    ];

    protected $casts = [
        'planned_transfer_date' => 'date',
        'is_weight_over_limit' => 'boolean',
    ];

    public function wasteBatch(): BelongsTo
    {
        return $this->belongsTo(WasteBatch::class);
    }

    public function carrier(): BelongsTo
    {
        return $this->belongsTo(Carrier::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function manifestForm(): HasOne
    {
        return $this->hasOne(ManifestForm::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function processHistories(): MorphMany
    {
        return $this->morphMany(ProcessHistory::class, 'processable');
    }

    public function canBeApproved(): bool
    {
        if ($this->carrier->isQualificationExpired()) {
            return false;
        }

        if (!$this->manifestForm || $this->manifestForm->status !== 'verified') {
            return false;
        }

        return true;
    }

    public function hasManifestMissing(): bool
    {
        return !$this->manifestForm || !$this->manifestForm->manifest_document;
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'pending' => '待确认',
            'manifest_verified' => '联单已确认',
            'approved' => '已放行',
            'rejected' => '已退回',
            'archived' => '已归档',
        ];

        return $labels[$this->status] ?? $this->status;
    }

    public function getProcessingTimeInHours(): float
    {
        $start = $this->created_at;
        $end = $this->review?->created_at ?? now();
        
        return round($start->diffInMinutes($end) / 60, 2);
    }
}
