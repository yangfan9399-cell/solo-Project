<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameOperation extends Model
{
    protected $fillable = [
        'game_session_id',
        'operation_type',
        'box_id',
        'from_floor',
        'to_floor',
        'state_before',
        'state_after',
        'sequence_number',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function getStateBeforeArray(): array
    {
        return json_decode($this->state_before, true) ?? [];
    }

    public function getStateAfterArray(): array
    {
        return json_decode($this->state_after, true) ?? [];
    }
}
