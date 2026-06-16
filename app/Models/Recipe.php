<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'user_id',
        'level_id',
        'recipe_data',
        'viscosity',
        'drying_time',
        'transparency',
        'score',
        'is_shared',
        'share_code',
        'like_count',
    ];

    protected $casts = [
        'recipe_data' => 'array',
        'is_shared' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function scopeShared($query)
    {
        return $query->where('is_shared', true);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    protected static function booted(): void
    {
        static::creating(function ($recipe) {
            if (empty($recipe->share_code)) {
                $recipe->share_code = strtoupper(substr(md5(uniqid()), 0, 8));
            }
        });
    }
}
