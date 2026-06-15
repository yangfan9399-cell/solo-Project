<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_name',
        'start_time',
        'end_time',
        'status',
        'oxygen',
        'max_oxygen',
        'equipment_durability',
        'max_durability',
        'score',
        'player_x',
        'player_y',
        'cave_data',
        'revealed_map',
        'final_notes',
    ];

    protected $casts = [
        'cave_data' => 'array',
        'revealed_map' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function probeRecords(): HasMany
    {
        return $this->hasMany(ProbeRecord::class);
    }

    public function probeHistories(): HasMany
    {
        return $this->hasMany(ProbeHistory::class);
    }

    public function probeResults(): HasMany
    {
        return $this->hasMany(ProbeResult::class);
    }

    public function expeditionLogs(): HasMany
    {
        return $this->hasMany(ExpeditionLog::class);
    }
}
