<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected $appends = ['is_supervisor', 'is_store_manager', 'is_region_manager', 'is_operation'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function roles()
    {
        return $this->hasMany(UserRole::class);
    }

    public function hasRole($role)
    {
        return $this->roles()->where('role', $role)->exists();
    }

    public function getIsSupervisorAttribute()
    {
        return $this->hasRole('supervisor');
    }

    public function getIsStoreManagerAttribute()
    {
        return $this->hasRole('store_manager');
    }

    public function getIsRegionManagerAttribute()
    {
        return $this->hasRole('region_manager');
    }

    public function getIsOperationAttribute()
    {
        return $this->hasRole('operation');
    }

    public function managedStores()
    {
        return $this->hasMany(Store::class, 'manager_id');
    }

    public function regionStores()
    {
        return $this->hasMany(Store::class, 'region_manager_id');
    }
}