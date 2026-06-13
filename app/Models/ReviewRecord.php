<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ReviewRecord extends Model
{
    use HasFactory;

    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_REVIEWING = 'reviewing';
    const STATUS_APPEALING = 'appealing';
    const STATUS_ARCHIVED = 'archived';
    const STATUS_RETURNED = 'returned';

    const ANOMALY_NONE = null;
    const ANOMALY_NO_CONFLICT = 'no_conflict';
    const ANOMALY_AMOUNT_DIFF = 'amount_diff';
    const ANOMALY_COUNT_DIFF = 'count_diff';
    const ANOMALY_APPEAL = 'appeal';

    protected $fillable = [
        'record_no',
        'title',
        'source',
        'source_dept',
        'student_name',
        'student_id',
        'college',
        'major',
        'grade',
        'scholarship_type',
        'scholarship_level',
        'apply_amount',
        'approved_amount',
        'apply_count',
        'approved_count',
        'status',
        'anomaly_type',
        'block_reason',
        'remedy_path',
        'current_owner_id',
        'original_data',
        'processed_data',
        'diff_fields',
        'basis',
        'conclusion',
        'is_archived',
        'received_at',
        'processed_at',
        'reviewed_at',
        'archived_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'original_data' => 'array',
            'processed_data' => 'array',
            'diff_fields' => 'array',
            'is_archived' => 'boolean',
            'received_at' => 'datetime',
            'processed_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'archived_at' => 'datetime',
            'apply_amount' => 'decimal:2',
            'approved_amount' => 'decimal:2',
        ];
    }

    public function currentOwner()
    {
        return $this->belongsTo(User::class, 'current_owner_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function nodes()
    {
        return $this->hasMany(ReviewNode::class)->orderBy('sequence', 'asc');
    }

    public function activeNodes()
    {
        return $this->hasMany(ReviewNode::class)->where('is_active', true)->orderBy('sequence', 'asc');
    }

    public function latestNode()
    {
        return $this->hasOne(ReviewNode::class)->where('is_active', true)->latestOfMany();
    }

    public function discrepancies()
    {
        return $this->hasMany(DiscrepancyRecord::class);
    }

    public function appeals()
    {
        return $this->hasMany(AppealRecord::class);
    }

    public function attachments()
    {
        return $this->hasMany(Attachment::class);
    }

    public function scopeNotArchived(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('is_archived', true);
    }

    public function scopeHasAnomaly(Builder $query): Builder
    {
        return $query->whereNotNull('anomaly_type');
    }

    public function scopeByStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    public function canEdit(): bool
    {
        return !$this->is_archived;
    }

    public function getHasAnomalyAttribute(): bool
    {
        return !is_null($this->anomaly_type);
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            self::STATUS_PENDING => '待受理',
            self::STATUS_PROCESSING => '处理中',
            self::STATUS_REVIEWING => '复核中',
            self::STATUS_APPEALING => '申诉中',
            self::STATUS_ARCHIVED => '已归档',
            self::STATUS_RETURNED => '已退回',
        ];
        return $labels[$this->status] ?? $this->status;
    }

    public function getAnomalyLabelAttribute(): ?string
    {
        if (!$this->anomaly_type) {
            return null;
        }
        $labels = [
            self::ANOMALY_NO_CONFLICT => '编号冲突',
            self::ANOMALY_AMOUNT_DIFF => '金额差异',
            self::ANOMALY_COUNT_DIFF => '数量差异',
            self::ANOMALY_APPEAL => '当事人申诉',
        ];
        return $labels[$this->anomaly_type] ?? $this->anomaly_type;
    }

    public function getSummaryAttribute(): array
    {
        return [
            'id' => $this->id,
            'record_no' => $this->record_no,
            'title' => $this->title,
            'student_name' => $this->student_name,
            'student_id' => $this->student_id,
            'college' => $this->college,
            'scholarship_type' => $this->scholarship_type,
            'apply_amount' => $this->apply_amount,
            'approved_amount' => $this->approved_amount,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'anomaly_type' => $this->anomaly_type,
            'anomaly_label' => $this->anomaly_label,
            'is_archived' => $this->is_archived,
            'current_owner' => $this->currentOwner ? [
                'id' => $this->currentOwner->id,
                'name' => $this->currentOwner->name,
                'department' => $this->currentOwner->department,
            ] : null,
            'received_at' => $this->received_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
