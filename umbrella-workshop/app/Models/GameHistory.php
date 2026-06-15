<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameHistory extends Model
{
    protected $fillable = [
        'game_id',
        'humidity',
        'smoothness_before',
        'smoothness_after',
        'change_reason',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
