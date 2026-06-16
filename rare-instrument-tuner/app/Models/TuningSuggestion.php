<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TuningSuggestion extends Model
{
    protected $fillable = [
        'tuning_session_id',
        'string_index',
        'current_freq',
        'target_freq',
        'adjustment_cents',
        'action',
        'note',
    ];

    public function tuningSession(): BelongsTo
    {
        return $this->belongsTo(TuningSession::class);
    }
}
