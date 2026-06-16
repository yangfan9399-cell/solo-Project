<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PlayerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'display_name',
        'avatar',
        'total_score',
        'games_played',
        'games_won',
        'current_streak',
        'best_streak',
        'hints_used_total',
        'unlocked_achievements',
    ];

    protected $casts = [
        'unlocked_achievements' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function getWinRateAttribute(): float
    {
        if ($this->games_played === 0) {
            return 0.0;
        }
        return round($this->games_won / $this->games_played * 100, 2);
    }
}
