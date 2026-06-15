<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameDetail extends Model
{
    protected $fillable = [
        'game_id',
        'pasting_order',
        'drying_time',
        'drying_step',
        'actual_drying_progress',
    ];

    protected $casts = [
        'pasting_order' => 'array',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
