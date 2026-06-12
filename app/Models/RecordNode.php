<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RecordNode extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inspection_record_id',
        'node_type',
        'node_name',
        'description',
        'remark',
        'operator_id',
        'action',
        'changed_fields',
        'snapshot',
        'operated_at',
        'node_order',
    ];

    protected $casts = [
        'operated_at' => 'datetime',
        'changed_fields' => 'array',
        'snapshot' => 'array',
    ];

    public const NODE_ACCEPTED = 'accepted';
    public const NODE_PROCESSING = 'processing';
    public const NODE_REVIEWING = 'reviewing';
    public const NODE_APPROVED = 'approved';
    public const NODE_ARCHIVED = 'archived';
    public const NODE_RETURNED = 'returned';
    public const NODE_APPEALED = 'appealed';

    public const NODE_NAMES = [
        self::NODE_ACCEPTED => '受理登记',
        self::NODE_PROCESSING => '业务处理',
        self::NODE_REVIEWING => '复核审批',
        self::NODE_APPROVED => '审批通过',
        self::NODE_ARCHIVED => '归档完成',
        self::NODE_RETURNED => '退回补证',
        self::NODE_APPEALED => '申诉处理',
    ];

    public const ACTION_CREATE = 'create';
    public const ACTION_UPDATE = 'update';
    public const ACTION_SUBMIT = 'submit';
    public const ACTION_APPROVE = 'approve';
    public const ACTION_REJECT = 'reject';
    public const ACTION_ARCHIVE = 'archive';
    public const ACTION_REOPEN = 'reopen';
    public const ACTION_SUPPLEMENT = 'supplement';
    public const ACTION_APPEAL = 'appeal';

    public const ACTION_LABELS = [
        self::ACTION_CREATE => '创建',
        self::ACTION_UPDATE => '更新',
        self::ACTION_SUBMIT => '提交',
        self::ACTION_APPROVE => '通过',
        self::ACTION_REJECT => '驳回',
        self::ACTION_ARCHIVE => '归档',
        self::ACTION_REOPEN => '重开',
        self::ACTION_SUPPLEMENT => '补充',
        self::ACTION_APPEAL => '申诉',
    ];

    public function inspectionRecord(): BelongsTo
    {
        return $this->belongsTo(InspectionRecord::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function supplements(): HasMany
    {
        return $this->hasMany(BusinessSupplement::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(EvidenceAttachment::class);
    }

    public function abnormalRecords(): HasMany
    {
        return $this->hasMany(AbnormalRecord::class);
    }

    public function getNodeNameLabelAttribute(): string
    {
        return $this->node_name ?: (self::NODE_NAMES[$this->node_type] ?? $this->node_type);
    }

    public function getActionLabelAttribute(): string
    {
        return self::ACTION_LABELS[$this->action] ?? $this->action;
    }
}
