<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AllocationNode extends Model
{
    protected $fillable = [
        'allocation_id',
        'node_type',
        'handler_id',
        'handler_role',
        'description',
        'before_data',
        'after_data',
        'basis',
    ];

    protected function casts(): array
    {
        return [
            'before_data' => 'array',
            'after_data' => 'array',
        ];
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(Allocation::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handler_id');
    }

    public function differences(): HasMany
    {
        return $this->hasMany(AllocationDifference::class, 'node_id');
    }
}
