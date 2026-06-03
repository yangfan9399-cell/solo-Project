<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'phone',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'role' => 'string',
    ];

    public function plots()
    {
        return $this->hasMany(Plot::class, 'farmer_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'farmer_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'operator_id');
    }

    public function exceptions()
    {
        return $this->hasMany(MException::class, 'reported_by');
    }
}
