<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QualityInspection extends Model
{
    protected $fillable = [
        'game_id',
        'inspection_type',
        'result',
        'score',
        'notes',
        'needs_rollback',
    ];

    protected $casts = [
        'needs_rollback' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
