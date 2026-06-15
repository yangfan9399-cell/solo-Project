<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderEvaluation extends Model
{
    protected $fillable = [
        'game_id',
        'customer_name',
        'satisfaction',
        'review_score',
        'comment',
        'needs_recalc',
    ];

    protected $casts = [
        'needs_recalc' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }
}
