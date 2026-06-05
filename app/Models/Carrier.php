<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Carrier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'license_number',
        'contact_person',
        'phone',
        'qualification_expiry_date',
        'qualification_certificate',
        'is_active',
    ];

    protected $casts = [
        'qualification_expiry_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function transferRequests(): HasMany
    {
        return $this->hasMany(TransferRequest::class);
    }

    public function isQualificationExpired(): bool
    {
        return $this->qualification_expiry_date->isPast();
    }

    public function getDaysUntilExpiryAttribute(): int
    {
        return now()->diffInDays($this->qualification_expiry_date, false);
    }
}
