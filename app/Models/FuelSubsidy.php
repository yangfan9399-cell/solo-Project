<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FuelSubsidy extends Model
{
    protected $fillable = [
        'schedule_id',
        'fuel_amount',
        'unit_price',
        'subsidy_rate',
        'total_subsidy',
        'calculated_at',
        'status',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'fuel_amount' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'subsidy_rate' => 'decimal:4',
        'total_subsidy' => 'decimal:2',
        'calculated_at' => 'datetime',
        'approved_at' => 'datetime',
        'status' => 'string',
    ];

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
