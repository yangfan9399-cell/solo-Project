<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tool extends Model
{
    protected $fillable = [
        'case_id',
        'tool_code',
        'tool_name',
        'specification',
        'expected_quantity',
        'actual_quantity',
        'expected_amount',
        'actual_amount',
        'status',
        'remark',
    ];

    protected function casts(): array
    {
        return [
            'expected_amount' => 'decimal:2',
            'actual_amount' => 'decimal:2',
        ];
    }

    public function toolCase(): BelongsTo
    {
        return $this->belongsTo(ToolCase::class, 'case_id');
    }

    public function hasQuantityDiff(): bool
    {
        return $this->expected_quantity !== $this->actual_quantity;
    }

    public function hasAmountDiff(): bool
    {
        return (float)$this->expected_amount !== (float)$this->actual_amount;
    }

    public function quantityDiff(): int
    {
        return $this->actual_quantity - $this->expected_quantity;
    }

    public function amountDiff(): float
    {
        return (float)$this->actual_amount - (float)$this->expected_amount;
    }
}
