<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WasteCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'hazard_code',
        'max_weight_per_batch',
        'description',
        'is_active',
    ];

    protected $casts = [
        'max_weight_per_batch' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function wasteBatches(): HasMany
    {
        return $this->hasMany(WasteBatch::class);
    }

    public function isWeightOverLimit(float $weight): bool
    {
        return $weight > $this->max_weight_per_batch;
    }
}
