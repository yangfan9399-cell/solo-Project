<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Machine extends Model
{
    protected $fillable = [
        'operator_id',
        'name',
        'type',
        'model',
        'license_plate',
        'fuel_consumption_rate',
        'purchase_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'fuel_consumption_rate' => 'decimal:2',
        'purchase_date' => 'date',
        'status' => 'string',
    ];

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'machine_id');
    }
}
