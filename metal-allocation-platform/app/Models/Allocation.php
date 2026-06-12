<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Allocation extends Model
{
    protected $fillable = [
        'allocation_no',
        'source_vault',
        'target_vault',
        'metal_type',
        'quantity',
        'unit',
        'amount',
        'status',
        'current_handler_id',
        'source_info',
        'conclusion',
        'blocking_reason',
        'remediation_path',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'amount' => 'decimal:2',
        ];
    }

    public function currentHandler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_handler_id');
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(AllocationNode::class);
    }

    public function differences(): HasMany
    {
        return $this->hasMany(AllocationDifference::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AllocationAttachment::class);
    }
}
