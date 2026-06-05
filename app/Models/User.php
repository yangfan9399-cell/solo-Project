<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    const ROLE_WAREHOUSE_OPERATOR = 'warehouse_operator';
    const ROLE_ENVIRONMENTAL_OFFICER = 'environmental_officer';
    const ROLE_REVIEWER = 'reviewer';

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

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isWarehouseOperator(): bool
    {
        return $this->role === self::ROLE_WAREHOUSE_OPERATOR;
    }

    public function isEnvironmentalOfficer(): bool
    {
        return $this->role === self::ROLE_ENVIRONMENTAL_OFFICER;
    }

    public function isReviewer(): bool
    {
        return $this->role === self::ROLE_REVIEWER;
    }

    public function getRoleLabelAttribute(): string
    {
        $labels = [
            self::ROLE_WAREHOUSE_OPERATOR => '仓库经办人',
            self::ROLE_ENVIRONMENTAL_OFFICER => '环保专员',
            self::ROLE_REVIEWER => '复核人',
        ];

        return $labels[$this->role] ?? $this->role;
    }
}
