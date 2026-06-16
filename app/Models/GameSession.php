<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    protected $fillable = [
        'user_id',
        'level_id',
        'player_profile_id',
        'status',
        'current_score',
        'penalty_score',
        'hints_used',
        'rotor_positions',
        'substitution_table',
        'partial_solution',
        'started_at',
        'completed_at',
        'abandoned_at',
        'duration_seconds',
        'solution_verified',
        'metadata',
    ];

    protected $casts = [
        'rotor_positions' => 'array',
        'substitution_table' => 'array',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'abandoned_at' => 'datetime',
        'solution_verified' => 'boolean',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function playerProfile(): BelongsTo
    {
        return $this->belongsTo(PlayerProfile::class);
    }

    public function actionHistories(): HasMany
    {
        return $this->hasMany(ActionHistory::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(GameNote::class);
    }

    public function hintUses(): HasMany
    {
        return $this->hasMany(HintUse::class);
    }

    public function getElapsedSecondsAttribute(): int
    {
        $end = $this->completed_at ?? $this->abandoned_at ?? now();
        return $end->getTimestamp() - $this->started_at->getTimestamp();
    }

    public function getFinalScoreAttribute(): int
    {
        return max(0, $this->current_score - $this->penalty_score);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'in_progress' => '进行中',
            'completed' => '已通关',
            'abandoned' => '已放弃',
            'failed' => '失败',
            default => $this->status,
        };
    }
}
