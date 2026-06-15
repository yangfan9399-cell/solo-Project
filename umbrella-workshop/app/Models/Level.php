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
        'target_score',
        'humidity_range',
    ];

    protected $casts = [
        'humidity_range' => 'array',
    ];

    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }
}
