<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Disposal extends Model
{
    protected $fillable = [
        'sample_id',
        'reviewer_id',
        'suggestion',
        'action',
        'decision_note',
        'status',
    ];

    const ACTION_RELEASE = 'release';
    const ACTION_DESTROY = 'destroy';
    const ACTION_RETURN_TO_ORIGIN = 'return_to_origin';
    const ACTION_REINSPECTION = 'reinspection';
    const ACTION_RETURN_TO_SAMPLER = 'return_to_sampler';

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_RETURNED = 'returned';
    const STATUS_ARCHIVED = 'archived';

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function getActionNameAttribute()
    {
        return match ($this->action) {
            self::ACTION_RELEASE => '放行',
            self::ACTION_DESTROY => '销毁',
            self::ACTION_RETURN_TO_ORIGIN => '退回产地',
            self::ACTION_REINSPECTION => '复检',
            self::ACTION_RETURN_TO_SAMPLER => '退回抽样员',
            default => '未知',
        };
    }

    public function getStatusNameAttribute()
    {
        return match ($this->status) {
            self::STATUS_PENDING => '待处理',
            self::STATUS_APPROVED => '已批准',
            self::STATUS_RETURNED => '已退回',
            self::STATUS_ARCHIVED => '已归档',
            default => '未知',
        };
    }
}
