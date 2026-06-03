<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plot extends Model
{
    protected $fillable = [
        'farmer_id',
        'name',
        'address',
        'area',
        'crop_type',
        'soil_type',
        'status',
        'notes',
    ];

    protected $casts = [
        'area' => 'decimal:2',
        'status' => 'string',
    ];

    public function farmer()
    {
        return $this->belongsTo(User::class, 'farmer_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'plot_id');
    }
}
