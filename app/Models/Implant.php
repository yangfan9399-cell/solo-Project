<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Implant extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_number',
        'brand',
        'model',
        'production_date',
        'expiry_date',
        'quantity',
        'used_quantity',
        'is_recalled',
        'recall_reason',
        'recall_date',
    ];

    public function surgeries()
    {
        return $this->hasMany(Surgery::class);
    }

    public function getAvailableQuantityAttribute()
    {
        return $this->quantity - $this->used_quantity;
    }
}
