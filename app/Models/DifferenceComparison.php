<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DifferenceComparison extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inspection_record_id',
        'from_node_id',
        'to_node_id',
        'field_name',
        'field_label',
        'before_value',
        'after_value',
        'change_type',
        'remark',
        'operator_id',
        'compared_at',
    ];

    protected $casts = [
        'compared_at' => 'datetime',
    ];

    public const CHANGE_CREATE = 'create';
    public const CHANGE_UPDATE = 'update';
    public const CHANGE_DELETE = 'delete';

    public const CHANGE_LABELS = [
        self::CHANGE_CREATE => '新增',
        self::CHANGE_UPDATE => '修改',
        self::CHANGE_DELETE => '删除',
    ];

    public const FIELD_LABELS = [
        'inspection_time' => '检查时间',
        'household_name' => '户主姓名',
        'household_phone' => '户主电话',
        'address' => '地址',
        'gas_meter_no' => '燃气表编号',
        'involve_amount' => '涉及金额',
        'involve_quantity' => '涉及数量',
        'evidence_conclusion' => '证据结论',
        'current_responsible_id' => '当前责任人',
        'hidden_danger' => '隐患描述',
        'danger_level' => '隐患等级',
        'handling_basis' => '采用依据',
        'status' => '状态',
        'conclusion' => '处理结论',
    ];

    public function inspectionRecord(): BelongsTo
    {
        return $this->belongsTo(InspectionRecord::class);
    }

    public function fromNode(): BelongsTo
    {
        return $this->belongsTo(RecordNode::class, 'from_node_id');
    }

    public function toNode(): BelongsTo
    {
        return $this->belongsTo(RecordNode::class, 'to_node_id');
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }

    public function getChangeLabelAttribute(): string
    {
        return self::CHANGE_LABELS[$this->change_type] ?? $this->change_type;
    }

    public function getFieldDisplayLabelAttribute(): string
    {
        return $this->field_label ?: (self::FIELD_LABELS[$this->field_name] ?? $this->field_name);
    }
}
