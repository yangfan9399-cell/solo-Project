<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClueCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'level_id',
        'title',
        'content',
        'category',
        'importance_score',
        'spoiler_risk',
        'reveal_order',
        'is_required',
        'related_clue_ids',
        'icon',
    ];

    protected $casts = [
        'related_clue_ids' => 'array',
        'is_required' => 'boolean',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function distributedClues(): HasMany
    {
        return $this->hasMany(DistributedClue::class);
    }

    public function playerQuestions(): HasMany
    {
        return $this->hasMany(PlayerQuestion::class, 'related_clue_id');
    }

    public function getCategoryLabel(): string
    {
        $categories = [
            'physical' => '🗝️ 物证',
            'testimony' => '💬 证词',
            'document' => '📄 文件',
            'digital' => '💻 电子证据',
            'scene' => '🏠 现场',
        ];
        return $categories[$this->category] ?? '❓ 其他';
    }

    public function getSpoilerRiskLabel(): string
    {
        if ($this->spoiler_risk === 0) {
            return '✅ 安全';
        }
        if ($this->spoiler_risk <= 30) {
            return '⚠️ 低风险';
        }
        if ($this->spoiler_risk <= 60) {
            return '🔶 中风险';
        }
        return '🔴 高风险';
    }
}
