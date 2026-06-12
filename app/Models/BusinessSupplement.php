<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class BusinessSupplement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inspection_record_id',
        'record_node_id',
        'supplement_type',
        'content',
        'operator_id',
        'supplemented_at',
    ];

    protected $casts = [
        'supplemented_at' => 'datetime',
    ];

    public const TYPE_BUSINESS_RECORD = 'business_record';
    public const TYPE_ON_SITE_EXPLAIN = 'on_site_explain';
    public const TYPE_OTHER = 'other';

    public const TYPE_LABELS = [
        self::TYPE_BUSINESS_RECORD => '业务记录',
        self::TYPE_ON_SITE_EXPLAIN => '现场说明',
        self::TYPE_OTHER => '其他',
    ];

    public function inspectionRecord(): BelongsTo
    {
        return $this->belongsTo(InspectionRecord::class);
    }

    public function recordNode(): BelongsTo
    {
        return $this->belongsTo(RecordNode::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->supplement_type] ?? $this->supplement_type;
    }
}
