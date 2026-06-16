<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = [
        'name',
        'description',
        'difficulty',
        'floor_count',
        'base_score',
        'time_bonus_seconds',
        'undo_penalty',
        'mutex_rules',
    ];

    protected function casts(): array
    {
        return [
            'mutex_rules' => 'array',
        ];
    }

    public function archiveBoxes(): HasMany
    {
        return $this->hasMany(ArchiveBox::class)->orderBy('sort_order');
    }

    public function clues(): HasMany
    {
        return $this->hasMany(Clue::class)->orderBy('sort_order');
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }
}
