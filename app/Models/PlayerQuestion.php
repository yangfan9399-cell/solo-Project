<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'question',
        'host_response',
        'round_number',
        'is_relevant',
        'triggers_clue',
        'related_clue_id',
        'relevance_score',
    ];

    protected $casts = [
        'is_relevant' => 'boolean',
        'triggers_clue' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function relatedClue(): BelongsTo
    {
        return $this->belongsTo(ClueCard::class, 'related_clue_id');
    }
}
