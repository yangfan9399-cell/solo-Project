<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppealRecord extends Model
{
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_UPHELD = 'upheld';
    const STATUS_REJECTED = 'rejected';
    const STATUS_PARTIAL = 'partial';

    protected $fillable = [
        'review_record_id',
        'review_node_id',
        'appeal_no',
        'appealer_name',
        'appealer_contact',
        'appealer_type',
        'appeal_reason',
        'appeal_content',
        'appeal_evidence',
        'appealed_at',
        'handling_opinion',
        'final_result',
        'status',
        'handled_by',
        'handled_at',
        'reject_reason',
        'is_verified',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'appeal_evidence' => 'array',
            'metadata' => 'array',
            'appealed_at' => 'datetime',
            'handled_at' => 'datetime',
            'is_verified' => 'boolean',
        ];
    }

    public function reviewRecord()
    {
        return $this->belongsTo(ReviewRecord::class);
    }

    public function reviewNode()
    {
        return $this->belongsTo(ReviewNode::class);
    }

    public function handledBy()
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            self::STATUS_PENDING => '待处理',
            self::STATUS_PROCESSING => '处理中',
            self::STATUS_UPHELD => '申诉成立',
            self::STATUS_REJECTED => '申诉驳回',
            self::STATUS_PARTIAL => '部分支持',
        ];
        return $labels[$this->status] ?? $this->status;
    }

    public function getAppealerTypeLabelAttribute(): string
    {
        $labels = [
            'student' => '学生本人',
            'parent' => '家长',
            'college' => '学院',
            'other' => '其他',
        ];
        return $labels[$this->appealer_type] ?? $this->appealer_type;
    }
}
