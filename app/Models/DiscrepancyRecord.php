<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscrepancyRecord extends Model
{
    const TYPE_NO_CONFLICT = 'no_conflict';
    const TYPE_AMOUNT_DIFF = 'amount_diff';
    const TYPE_COUNT_DIFF = 'count_diff';
    const TYPE_DATA_MISMATCH = 'data_mismatch';

    const STATUS_PENDING = 'pending';
    const STATUS_RESOLVED = 'resolved';
    const STATUS_WAIVED = 'waived';

    protected $fillable = [
        'review_record_id',
        'review_node_id',
        'discrepancy_type',
        'field_name',
        'expected_value',
        'actual_value',
        'description',
        'block_reason',
        'remedy_path',
        'resolution',
        'status',
        'resolved_by',
        'resolved_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'resolved_at' => 'datetime',
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

    public function resolvedBy()
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    public function getDiscrepancyTypeLabelAttribute(): string
    {
        $labels = [
            self::TYPE_NO_CONFLICT => '编号冲突',
            self::TYPE_AMOUNT_DIFF => '金额差异',
            self::TYPE_COUNT_DIFF => '数量差异',
            self::TYPE_DATA_MISMATCH => '数据不一致',
        ];
        return $labels[$this->discrepancy_type] ?? $this->discrepancy_type;
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            self::STATUS_PENDING => '待处理',
            self::STATUS_RESOLVED => '已解决',
            self::STATUS_WAIVED => '已豁免',
        ];
        return $labels[$this->status] ?? $this->status;
    }
}
