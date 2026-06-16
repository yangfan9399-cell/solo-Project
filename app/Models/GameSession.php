<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    protected $fillable = [
        'player_id',
        'level_id',
        'status',
        'score',
        'undo_count',
        'operation_count',
        'current_state',
        'started_at',
        'completed_at',
        'time_taken_seconds',
        'final_report',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function operations(): HasMany
    {
        return $this->hasMany(GameOperation::class)->orderBy('sequence_number');
    }

    public function getCurrentStateArray(): array
    {
        return json_decode($this->current_state, true) ?? [];
    }

    public function setCurrentStateArray(array $state): void
    {
        $this->current_state = json_encode($state);
    }
}
