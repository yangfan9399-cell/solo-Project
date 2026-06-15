<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpeditionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'log_type',
        'title',
        'message',
        'details',
        'oxygen_change',
        'durability_change',
    ];

    protected $casts = [
        'details' => 'array',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }
}
