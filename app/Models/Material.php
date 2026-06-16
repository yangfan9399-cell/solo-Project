<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'type',
        'color',
        'viscosity_factor',
        'drying_time_factor',
        'transparency_factor',
        'base_viscosity',
        'base_drying_time',
        'base_transparency',
        'is_unlocked_by_default',
        'unlock_level_id',
        'order',
        'is_active',
    ];

    protected $casts = [
        'is_unlocked_by_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function operationHistories(): HasMany
    {
        return $this->hasMany(OperationHistory::class);
    }

    public function userMaterials(): HasMany
    {
        return $this->hasMany(UserMaterial::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc');
    }

    public function scopeBase($query)
    {
        return $query->where('type', 'base');
    }

    public function scopeAdditive($query)
    {
        return $query->where('type', 'additive');
    }
}
