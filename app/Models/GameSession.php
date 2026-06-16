<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'level_id',
        'status',
        'attempt_count',
        'final_score',
        'final_viscosity',
        'final_drying_time',
        'final_transparency',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function operationHistories(): HasMany
    {
        return $this->hasMany(OperationHistory::class)->orderBy('step_number', 'asc');
    }

    public function scopePlaying($query)
    {
        return $query->where('status', 'playing');
    }

    public function scopeCompleted($query)
    {
        return $query->whereIn('status', ['won', 'lost']);
    }

    public function isPlaying(): bool
    {
        return $this->status === 'playing';
    }

    public function isWon(): bool
    {
        return $this->status === 'won';
    }

    public function isLost(): bool
    {
        return $this->status === 'lost';
    }
}
