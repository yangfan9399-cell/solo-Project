<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'story_intro',
        'truth_reveal',
        'difficulty',
        'max_score',
        'time_limit_minutes',
        'required_clues_to_solve',
    ];

    public function clueCards(): HasMany
    {
        return $this->hasMany(ClueCard::class);
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }

    public function requiredClues(): HasMany
    {
        return $this->hasMany(ClueCard::class)->where('is_required', true);
    }

    public function difficultyStars(): string
    {
        return str_repeat('⭐', $this->difficulty);
    }
}
