<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Player extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'avatar',
        'total_score',
        'games_played',
        'games_won',
    ];

    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }

    public function winRate(): float
    {
        if ($this->games_played === 0) {
            return 0.0;
        }
        return round(($this->games_won / $this->games_played) * 100, 1);
    }

    public function addScore(int $points, bool $won = false): void
    {
        $this->total_score += $points;
        $this->games_played += 1;
        if ($won) {
            $this->games_won += 1;
        }
        $this->save();
    }
}
