<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SessionVersion extends Model
{
    protected $fillable = [
        'tuning_session_id',
        'version_number',
        'snapshot_data',
        'change_description',
    ];

    protected $casts = [
        'snapshot_data' => 'array',
    ];

    public function tuningSession(): BelongsTo
    {
        return $this->belongsTo(TuningSession::class);
    }
}
