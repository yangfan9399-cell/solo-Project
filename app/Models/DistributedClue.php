<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DistributedClue extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'clue_card_id',
        'distributed_at_round',
        'distributed_at',
        'distributed_reason',
        'was_asked_about',
    ];

    protected $casts = [
        'distributed_at' => 'datetime',
        'was_asked_about' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function clueCard(): BelongsTo
    {
        return $this->belongsTo(ClueCard::class);
    }
}
