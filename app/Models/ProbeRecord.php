<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProbeRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'launch_point_x',
        'launch_point_y',
        'probe_direction',
        'frequency',
        'sequence_number',
        'launched_at',
    ];

    protected $casts = [
        'probe_direction' => 'float',
        'frequency' => 'float',
        'launched_at' => 'datetime',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function probeHistories(): HasMany
    {
        return $this->hasMany(ProbeHistory::class);
    }
}
