<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PracticeRecord extends Model
{
    protected $fillable = [
        'instrument_id',
        'tuning_session_id',
        'session_date',
        'duration_minutes',
        'accuracy_score',
        'notes',
    ];

    protected $casts = [
        'session_date' => 'date',
    ];

    public function instrument(): BelongsTo
    {
        return $this->belongsTo(Instrument::class);
    }

    public function tuningSession(): BelongsTo
    {
        return $this->belongsTo(TuningSession::class);
    }
}
