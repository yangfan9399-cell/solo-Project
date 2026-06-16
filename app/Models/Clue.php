<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Clue extends Model
{
    protected $fillable = [
        'level_id',
        'content',
        'type',
        'is_noise',
        'sort_order',
    ];

    protected $casts = [
        'is_noise' => 'boolean',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}
