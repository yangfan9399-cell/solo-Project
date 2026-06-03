<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MException extends Model
{
    protected $table = 'exceptions';

    protected $fillable = [
        'booking_id',
        'schedule_id',
        'reported_by',
        'type',
        'description',
        'status',
        'resolution',
        'resolved_by',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
        'status' => 'string',
        'type' => 'string',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function reportedBy()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}
