<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InspectionRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'record_no',
        'source',
        'source_no',
        'current_responsible_id',
        'household_name',
        'household_phone',
        'address',
        'gas_meter_no',
        'inspection_time',
        'inspector',
        'hidden_danger',
        'danger_level',
        'danger_type',
        'involve_amount',
        'involve_quantity',
        'evidence_conclusion',
        'handling_basis',
        'status',
        'sample_type',
        'summary',
        'conclusion',
        'is_archived',
        'archived_at',
        'archived_by',
        'has_blocking',
        'blocking_reason',
        'version',
        'parent_id',
        'created_by',
    ];

    protected $casts = [
        'inspection_time' => 'datetime',
        'archived_at' => 'datetime',
        'is_archived' => 'boolean',
        'has_blocking' => 'boolean',
        'involve_amount' => 'decimal:2',
    ];

    public const STATUS_ACCEPTED = 'accepted';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_REVIEWING = 'reviewing';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_ARCHIVED = 'archived';
    public const STATUS_RETURNED = 'returned';
    public const STATUS_APPEALED = 'appealed';
    public const STATUS_NUMBER_CONFLICT = 'number_conflict';
    public const STATUS_AMOUNT_DIFFERENCE = 'amount_difference';

    public const SAMPLE_NORMAL = 'normal';
    public const SAMPLE_NUMBER_CONFLICT = 'number_conflict';
    public const SAMPLE_AMOUNT_DIFFERENCE = 'amount_difference';
    public const SAMPLE_APPEAL = 'appeal';

    public const STATUS_LABELS = [
        self::STATUS_ACCEPTED => '已受理',
        self::STATUS_PROCESSING => '处理中',
        self::STATUS_REVIEWING => '复核中',
        self::STATUS_APPROVED => '已通过',
        self::STATUS_ARCHIVED => '已归档',
        self::STATUS_RETURNED => '已退回',
        self::STATUS_APPEALED => '申诉中',
        self::STATUS_NUMBER_CONFLICT => '编号冲突',
        self::STATUS_AMOUNT_DIFFERENCE => '金额差异',
    ];

    public const SAMPLE_LABELS = [
        self::SAMPLE_NORMAL => '正常归档',
        self::SAMPLE_NUMBER_CONFLICT => '编号冲突',
        self::SAMPLE_AMOUNT_DIFFERENCE => '数量/金额差异',
        self::SAMPLE_APPEAL => '当事人申诉',
    ];

    public const DANGER_LEVELS = [
        'general' => '一般',
        'major' => '较大',
        'serious' => '重大',
    ];

    public function currentResponsible(): BelongsTo
    {
        return $this->belongsTo(User::class, 'current_responsible_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(RecordNode::class)->orderBy('node_order');
    }

    public function latestNode(): HasMany
    {
        return $this->hasMany(RecordNode::class)->orderBy('node_order', 'desc')->limit(1);
    }

    public function supplements(): HasMany
    {
        return $this->hasMany(BusinessSupplement::class)->orderBy('supplemented_at', 'desc');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(EvidenceAttachment::class)->orderBy('uploaded_at', 'desc');
    }

    public function abnormalRecords(): HasMany
    {
        return $this->hasMany(AbnormalRecord::class)->orderBy('created_at', 'desc');
    }

    public function differenceComparisons(): HasMany
    {
        return $this->hasMany(DifferenceComparison::class)->orderBy('compared_at', 'desc');
    }

    public function isArchived(): bool
    {
        return $this->is_archived;
    }

    public function hasBlocking(): bool
    {
        return $this->has_blocking;
    }

    public function canEdit(): bool
    {
        return !$this->is_archived;
    }

    public function getStatusLabelAttribute(): string
    {
        return self::STATUS_LABELS[$this->status] ?? $this->status;
    }

    public function getSampleLabelAttribute(): string
    {
        return self::SAMPLE_LABELS[$this->sample_type] ?? $this->sample_type;
    }

    public function getDangerLevelLabelAttribute(): string
    {
        return self::DANGER_LEVELS[$this->danger_level] ?? $this->danger_level;
    }
}
