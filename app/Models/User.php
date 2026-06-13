<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'employee_no',
        'department',
        'phone',
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

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function ownedRecords()
    {
        return $this->hasMany(ReviewRecord::class, 'current_owner_id');
    }

    public function createdRecords()
    {
        return $this->hasMany(ReviewRecord::class, 'created_by');
    }

    public function operatedNodes()
    {
        return $this->hasMany(ReviewNode::class, 'operator_id');
    }

    public function hasPermission(string $permission): bool
    {
        if (!$this->role) {
            return false;
        }
        $permissions = $this->role->permissions ?? [];
        return in_array($permission, $permissions) || in_array('*', $permissions);
    }

    public function isBusinessSpecialist(): bool
    {
        return $this->role?->name === 'business_specialist';
    }

    public function isApprovalOfficer(): bool
    {
        return $this->role?->name === 'approval_officer';
    }
}
