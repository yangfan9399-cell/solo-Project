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
        'role',
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

    public const ROLE_BUSINESS_SPECIALIST = 'business_specialist';
    public const ROLE_APPROVAL_LEADER = 'approval_leader';

    public const ROLE_LABELS = [
        self::ROLE_BUSINESS_SPECIALIST => '业务专员',
        self::ROLE_APPROVAL_LEADER => '审批负责人',
    ];

    public function isBusinessSpecialist(): bool
    {
        return $this->role === self::ROLE_BUSINESS_SPECIALIST;
    }

    public function isApprovalLeader(): bool
    {
        return $this->role === self::ROLE_APPROVAL_LEADER;
    }

    public function getRoleLabelAttribute(): string
    {
        return self::ROLE_LABELS[$this->role] ?? $this->role;
    }

    public function canSupplement(): bool
    {
        return $this->isBusinessSpecialist();
    }

    public function canApprove(): bool
    {
        return $this->isApprovalLeader();
    }

    public function canArchive(): bool
    {
        return $this->isApprovalLeader();
    }

    public function responsibleRecords()
    {
        return $this->hasMany(InspectionRecord::class, 'current_responsible_id');
    }

    public function createdRecords()
    {
        return $this->hasMany(InspectionRecord::class, 'created_by');
    }

    public function operatedNodes()
    {
        return $this->hasMany(RecordNode::class, 'operator_id');
    }
}
