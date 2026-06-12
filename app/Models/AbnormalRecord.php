<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AbnormalRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inspection_record_id',
        'record_node_id',
        'abnormal_type',
        'blocking_reason',
        'difference_fields',
        'remedy_path',
        'resolution_status',
        'resolution_remark',
        'handled_by',
        'handled_at',
    ];

    protected $casts = [
        'difference_fields' => 'array',
        'handled_at' => 'datetime',
    ];

    public const TYPE_NUMBER_CONFLICT = 'number_conflict';
    public const TYPE_AMOUNT_DIFFERENCE = 'amount_difference';
    public const TYPE_QUANTITY_DIFFERENCE = 'quantity_difference';
    public const TYPE_APPEAL = 'appeal';

    public const TYPE_LABELS = [
        self::TYPE_NUMBER_CONFLICT => '编号冲突',
        self::TYPE_AMOUNT_DIFFERENCE => '金额差异',
        self::TYPE_QUANTITY_DIFFERENCE => '数量差异',
        self::TYPE_APPEAL => '当事人申诉',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    public const STATUS_LABELS = [
        self::STATUS_PENDING => '待处理',
        self::STATUS_RESOLVED => '已解决',
        self::STATUS_REJECTED => '已驳回',
    ];

    public function inspectionRecord(): BelongsTo
    {
        return $this->belongsTo(InspectionRecord::class);
    }

    public function recordNode(): BelongsTo
    {
        return $this->belongsTo(RecordNode::class);
    }

    public function handledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->abnormal_type] ?? $this->abnormal_type;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->resolution_status] ?? $this->resolution_status;
    }
}
