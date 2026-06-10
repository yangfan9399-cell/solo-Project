<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Decoration extends Model
{
    use HasFactory;

    protected $fillable = [
        'merchant_name',
        'merchant_type',
        'floor',
        'shop_number',
        'start_date',
        'end_date',
        'construction_scope',
        'hoarding_type',
        'hoarding_width',
        'hoarding_height',
        'hoarding_description',
        'fire_materials',
        'fire_materials_complete',
        'restricted_time',
        'time_conflict',
        'hoarding_dimension_ok',
        'status',
        'engineer_comment',
        'engineer_reviewed_at',
        'fire_comment',
        'fire_reviewed_at',
        'manager_comment',
        'manager_approved_at',
        'reject_reason',
    ];

    public function getStatusTextAttribute()
    {
        $statusMap = [
            'pending' => '待提交',
            'submitted' => '待工程部审核',
            'engineer_approved' => '待消防安全员复核',
            'fire_approved' => '待运营经理批准',
            'approved' => '已批准开工',
            'rejected' => '已退回',
            'completed' => '已完成',
        ];

        return $statusMap[$this->status] ?? $this->status;
    }

    public function getStatusClassAttribute()
    {
        $classMap = [
            'pending' => 'status-pending',
            'submitted' => 'status-reviewing',
            'engineer_approved' => 'status-reviewing',
            'fire_approved' => 'status-reviewing',
            'approved' => 'status-approved',
            'rejected' => 'status-rejected',
            'completed' => 'status-completed',
        ];

        return $classMap[$this->status] ?? 'status-pending';
    }

    public function getDurationAttribute()
    {
        $start = \Carbon\Carbon::parse($this->start_date);
        $end = \Carbon\Carbon::parse($this->end_date);
        return $start->diffInDays($end) + 1;
    }

    public function getApprovalDaysAttribute()
    {
        $submittedAt = $this->created_at;
        $approvedAt = $this->manager_approved_at ?? now();
        return $submittedAt->diffInDays($approvedAt);
    }
}
