<?php

namespace App\Models;

use App\Enums\UserRole;
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
        'role',
        'employee_id',
        'department',
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
            'role' => UserRole::class,
        ];
    }

    public function isClerk(): bool
    {
        return $this->role === UserRole::Clerk;
    }

    public function isApprover(): bool
    {
        return $this->role === UserRole::Approver;
    }

    public function reportedCases()
    {
        return $this->hasMany(ToolCase::class, 'reported_by');
    }

    public function handledCases()
    {
        return $this->hasMany(ToolCase::class, 'handled_by');
    }

    public function reviewedCases()
    {
        return $this->hasMany(ToolCase::class, 'reviewed_by');
    }
}
