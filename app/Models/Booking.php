<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Booking extends Model
{
    protected $fillable = [
        'booking_no',
        'farmer_id',
        'plot_id',
        'machine_type',
        'expected_date',
        'expected_area',
        'status',
        'notes',
        'confirmed_at',
        'cancelled_at',
        'cancel_reason',
    ];

    protected $casts = [
        'expected_date' => 'date',
        'expected_area' => 'decimal:2',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'status' => 'string',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Booking $booking) {
            if (empty($booking->booking_no)) {
                $now = now();
                $prefix = $now->format('ym');
                $lastBooking = static::where('booking_no', 'like', $prefix . '%')
                    ->orderBy('booking_no', 'desc')
                    ->first();

                if ($lastBooking) {
                    $lastSequence = (int) substr($lastBooking->booking_no, -4);
                    $nextSequence = $lastSequence + 1;
                } else {
                    $nextSequence = 1;
                }

                $booking->booking_no = $prefix . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function plot()
    {
        return $this->belongsTo(Plot::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function settlement()
    {
        return $this->hasOne(Settlement::class);
    }

    public function exceptions()
    {
        return $this->hasMany(MException::class);
    }
}
