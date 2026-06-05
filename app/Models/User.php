<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    const ROLE_SAMPLER = 'sampler';
    const ROLE_INSPECTOR = 'inspector';
    const ROLE_REVIEWER = 'reviewer';

    public function isSampler()
    {
        return $this->role === self::ROLE_SAMPLER;
    }

    public function isInspector()
    {
        return $this->role === self::ROLE_INSPECTOR;
    }

    public function isReviewer()
    {
        return $this->role === self::ROLE_REVIEWER;
    }

    public function samples()
    {
        return $this->hasMany(Sample::class, 'sampler_id');
    }

    public function inspectionResults()
    {
        return $this->hasMany(InspectionResult::class, 'inspector_id');
    }

    public function disposals()
    {
        return $this->hasMany(Disposal::class, 'reviewer_id');
    }

    public function getRoleNameAttribute()
    {
        return match ($this->role) {
            self::ROLE_SAMPLER => '抽样员',
            self::ROLE_INSPECTOR => '检测员',
            self::ROLE_REVIEWER => '复核人',
            default => '未知',
        };
    }
}
