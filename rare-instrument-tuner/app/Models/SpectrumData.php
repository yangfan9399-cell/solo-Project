<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpectrumData extends Model
{
    protected $fillable = [
        'tuning_session_id',
        'harmonic_order',
        'frequency',
        'amplitude',
        'deviation_cents',
        'is_anomaly',
    ];

    protected $casts = [
        'is_anomaly' => 'boolean',
    ];

    public function tuningSession(): BelongsTo
    {
        return $this->belongsTo(TuningSession::class);
    }
}
