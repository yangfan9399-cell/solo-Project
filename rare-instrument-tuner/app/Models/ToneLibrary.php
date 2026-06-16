<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToneLibrary extends Model
{
    protected $fillable = [
        'instrument_id',
        'note_name',
        'target_freq',
        'tolerance_cents',
        'description',
    ];

    public function instrument(): BelongsTo
    {
        return $this->belongsTo(Instrument::class);
    }
}
