<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Acceptance extends Model
{
    protected $fillable = [
        'schedule_id',
        'actual_area',
        'quality_score',
        'quality_notes',
        'accepted_by',
        'accepted_at',
        'status',
        'reject_reason',
    ];

    protected $casts = [
        'actual_area' => 'decimal:2',
        'quality_score' => 'integer',
        'accepted_at' => 'datetime',
        'status' => 'string',
    ];

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function acceptedBy()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }
}
