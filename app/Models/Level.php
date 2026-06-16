<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Level extends Model
{
    protected $fillable = [
        'name',
        'description',
        'difficulty',
        'base_score',
        'hint_penalty',
        'time_bonus_threshold',
        'rotor_count',
        'cipher_type',
        'plaintext',
        'ciphertext',
        'rotor_config',
        'solution_hints',
        'frequency_data',
        'is_custom',
        'created_by',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'rotor_config' => 'array',
        'solution_hints' => 'array',
        'frequency_data' => 'array',
        'is_custom' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function getDifficultyLabelAttribute(): string
    {
        return match ($this->difficulty) {
            'easy' => '入门',
            'medium' => '进阶',
            'hard' => '困难',
            'expert' => '专家',
            default => $this->difficulty,
        };
    }
}
