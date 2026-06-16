<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HintUse extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'game_session_id',
        'hint_index',
        'hint_content',
        'penalty_applied',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }
}
