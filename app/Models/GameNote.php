<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GameNote extends Model
{
    protected $fillable = [
        'game_session_id',
        'content',
        'category',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'general' => '综合',
            'frequency' => '频率分析',
            'pattern' => '模式发现',
            'rotor' => '转轮推理',
            default => $this->category,
        };
    }
}
