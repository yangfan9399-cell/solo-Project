<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Level extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'paper_type',
        'paper_description',
        'target_viscosity',
        'target_drying_time',
        'target_transparency',
        'viscosity_tolerance',
        'drying_time_tolerance',
        'transparency_tolerance',
        'max_attempts',
        'unlock_level_id',
        'unlock_score',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function userProgress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    public function unlockLevel(): BelongsTo
    {
        return $this->belongsTo(Level::class, 'unlock_level_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc');
    }
}
