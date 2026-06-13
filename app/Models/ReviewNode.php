<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReviewNode extends Model
{
    const NODE_TYPE_RECEIVE = 'receive';
    const NODE_TYPE_PROCESS = 'process';
    const NODE_TYPE_REVIEW = 'review';
    const NODE_TYPE_APPEAL = 'appeal';
    const NODE_TYPE_ARCHIVE = 'archive';
    const NODE_TYPE_REOPEN = 'reopen';
    const NODE_TYPE_RETURN = 'return';

    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_SKIPPED = 'skipped';

    protected $fillable = [
        'review_record_id',
        'node_type',
        'node_name',
        'status',
        'sequence',
        'operator_id',
        'operated_at',
        'business_note',
        'site_description',
        'evidence_note',
        'review_opinion',
        'action',
        'from_status',
        'to_status',
        'snapshot',
        'changes',
        'is_active',
        'reopen_reason',
        'reopened_by',
        'reopened_at',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'changes' => 'array',
            'is_active' => 'boolean',
            'operated_at' => 'datetime',
            'reopened_at' => 'datetime',
        ];
    }

    public function reviewRecord()
    {
        return $this->belongsTo(ReviewRecord::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function reopenedBy()
    {
        return $this->belongsTo(User::class, 'reopened_by');
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    public function discrepancies()
    {
        return $this->hasMany(DiscrepancyRecord::class);
    }

    public function getNodeTypeLabelAttribute(): string
    {
        $labels = [
            self::NODE_TYPE_RECEIVE => '受理',
            self::NODE_TYPE_PROCESS => '处理',
            self::NODE_TYPE_REVIEW => '复核',
            self::NODE_TYPE_APPEAL => '申诉处理',
            self::NODE_TYPE_ARCHIVE => '归档',
            self::NODE_TYPE_REOPEN => '重新处理',
            self::NODE_TYPE_RETURN => '退回补证',
        ];
        return $labels[$this->node_type] ?? $this->node_type;
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            self::STATUS_PENDING => '待处理',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_SKIPPED => '已跳过',
        ];
        return $labels[$this->status] ?? $this->status;
    }
}
