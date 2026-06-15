<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProbeResult extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_session_id',
        'probe_history_id',
        'wall_type',
        'is_false_echo',
        'measured_distance',
        'actual_distance',
        'confidence',
        'wet_wall_detected',
        'crack_detected',
        'collapse_detected',
        'oxygen_used',
        'durability_used',
        'analysis_notes',
    ];

    protected $casts = [
        'is_false_echo' => 'boolean',
        'measured_distance' => 'float',
        'actual_distance' => 'float',
        'confidence' => 'float',
        'wet_wall_detected' => 'boolean',
        'crack_detected' => 'boolean',
        'collapse_detected' => 'boolean',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function probeHistory(): BelongsTo
    {
        return $this->belongsTo(ProbeHistory::class);
    }
}
