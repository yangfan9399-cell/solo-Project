<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameResult extends Model
{
    protected $fillable = [
        'game_id',
        'material_combo',
        'cost_before',
        'cost_after',
        'durability_before',
        'durability_after',
        'change_reason',
    ];

    protected $casts = [
        'material_combo' => 'array',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
