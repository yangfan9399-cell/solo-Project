<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AllocationDifference extends Model
{
    protected $fillable = [
        'allocation_id',
        'node_id',
        'field_name',
        'expected_value',
        'actual_value',
    ];

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(Allocation::class);
    }

    public function node(): BelongsTo
    {
        return $this->belongsTo(AllocationNode::class, 'node_id');
    }
}
