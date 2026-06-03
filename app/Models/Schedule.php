<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $fillable = [
        'booking_id',
        'machine_id',
        'operator_id',
        'scheduled_date',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'status' => 'string',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function machine()
    {
        return $this->belongsTo(Machine::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function checkin()
    {
        return $this->hasOne(Checkin::class);
    }

    public function acceptance()
    {
        return $this->hasOne(Acceptance::class);
    }

    public function fuelSubsidy()
    {
        return $this->hasOne(FuelSubsidy::class);
    }
}
