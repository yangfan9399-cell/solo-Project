<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Game extends Model
{
    protected $fillable = [
        'level_id',
        'player_name',
        'status',
        'rib_material_id',
        'surface_material_id',
        'paper_material_id',
        'humidity',
        'total_cost',
        'total_durability',
        'smoothness',
        'score',
        'round_state',
    ];

    protected $casts = [
        'round_state' => 'array',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function ribMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'rib_material_id');
    }

    public function surfaceMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'surface_material_id');
    }

    public function paperMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'paper_material_id');
    }

    public function details(): HasOne
    {
        return $this->hasOne(GameDetail::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(GameHistory::class);
    }

    public function results(): HasMany
    {
        return $this->hasMany(GameResult::class);
    }

    public function qualityInspections(): HasMany
    {
        return $this->hasMany(QualityInspection::class);
    }

    public function orderEvaluations(): HasMany
    {
        return $this->hasMany(OrderEvaluation::class);
    }

    public function updateRoundState(string $step, array $data): void
    {
        $state = $this->round_state ?? [];
        $state[$step] = array_merge($state[$step] ?? [], $data, ['timestamp' => now()->toIso8601String()]);
        $this->round_state = $state;
        $this->save();
    }
}
