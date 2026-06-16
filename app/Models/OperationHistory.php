<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'step_number',
        'action_type',
        'material_id',
        'amount',
        'state_before',
        'state_after',
    ];

    protected $casts = [
        'state_before' => 'array',
        'state_after' => 'array',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
