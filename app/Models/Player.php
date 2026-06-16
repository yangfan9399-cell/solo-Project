<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    protected $fillable = [
        'name',
        'total_score',
        'games_played',
        'games_won',
        'best_streak',
        'current_streak',
    ];

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function addScore(int $score, bool $won): void
    {
        $this->total_score += $score;
        $this->games_played += 1;

        if ($won) {
            $this->games_won += 1;
            $this->current_streak += 1;
            if ($this->current_streak > $this->best_streak) {
                $this->best_streak = $this->current_streak;
            }
        } else {
            $this->current_streak = 0;
        }

        $this->save();
    }
}
