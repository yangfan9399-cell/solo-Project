<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProbeHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'probe_record_id',
        'frequency_used',
        'direction_used',
        'echo_curve_data',
        'revealed_points',
        'map_snapshot_before',
        'map_snapshot_after',
        'rollback_available',
        'rolled_back',
        'processed_at',
    ];

    protected $casts = [
        'frequency_used' => 'float',
        'direction_used' => 'float',
        'echo_curve_data' => 'array',
        'revealed_points' => 'array',
        'map_snapshot_before' => 'array',
        'map_snapshot_after' => 'array',
        'rollback_available' => 'boolean',
        'rolled_back' => 'boolean',
        'processed_at' => 'datetime',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function probeRecord(): BelongsTo
    {
        return $this->belongsTo(ProbeRecord::class);
    }

    public function probeResult(): HasOne
    {
        return $this->hasOne(ProbeResult::class);
    }
}
