<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
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

    public function gameSessions(): HasMany
    {
        return $this->hasMany(GameSession::class);
    }

    public function recipes(): HasMany
    {
        return $this->hasMany(Recipe::class);
    }

    public function userMaterials(): HasMany
    {
        return $this->hasMany(UserMaterial::class);
    }

    public function materials(): BelongsToMany
    {
        return $this->belongsToMany(Material::class, 'user_materials')
            ->withTimestamps()
            ->withPivot(['unlocked_at', 'unlock_level_id']);
    }

    public function userProgress(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }

    public function levels(): BelongsToMany
    {
        return $this->belongsToMany(Level::class, 'user_progress')
            ->withTimestamps()
            ->withPivot(['best_score', 'stars', 'attempts_count', 'is_completed', 'first_completed_at', 'last_played_at']);
    }

    public function activeGameSession()
    {
        return $this->gameSessions()->playing()->latest()->first();
    }

    public function hasUnlockedMaterial($materialId): bool
    {
        return $this->userMaterials()->where('material_id', $materialId)->exists();
    }

    public function hasCompletedLevel($levelId): bool
    {
        return $this->userProgress()
            ->where('level_id', $levelId)
            ->where('is_completed', true)
            ->exists();
    }

    public function getLevelStars($levelId): int
    {
        $progress = $this->userProgress()->where('level_id', $levelId)->first();
        return $progress?->stars ?? 0;
    }
}
