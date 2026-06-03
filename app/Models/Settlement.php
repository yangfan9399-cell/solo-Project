<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Settlement extends Model
{
    protected $fillable = [
        'settlement_no',
        'booking_id',
        'operator_id',
        'work_amount',
        'fuel_subsidy_amount',
        'total_deduction',
        'net_amount',
        'status',
        'settled_by',
        'settled_at',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'work_amount' => 'decimal:2',
        'fuel_subsidy_amount' => 'decimal:2',
        'total_deduction' => 'decimal:2',
        'net_amount' => 'decimal:2',
        'settled_at' => 'datetime',
        'paid_at' => 'datetime',
        'status' => 'string',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Settlement $settlement) {
            if (empty($settlement->settlement_no)) {
                $now = now();
                $prefix = 'JS' . $now->format('ym');
                $lastSettlement = static::where('settlement_no', 'like', $prefix . '%')
                    ->orderBy('settlement_no', 'desc')
                    ->first();

                if ($lastSettlement) {
                    $lastSequence = (int) substr($lastSettlement->settlement_no, -4);
                    $nextSequence = $lastSequence + 1;
                } else {
                    $nextSequence = 1;
                }

                $settlement->settlement_no = $prefix . str_pad((string) $nextSequence, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function settledBy()
    {
        return $this->belongsTo(User::class, 'settled_by');
    }
}
