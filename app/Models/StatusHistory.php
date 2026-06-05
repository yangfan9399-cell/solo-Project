<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusHistory extends Model
{
    protected $table = 'status_history';

    protected $fillable = [
        'sample_id',
        'user_id',
        'old_status',
        'new_status',
        'note',
    ];

    protected $appends = [
        'old_status_name',
        'new_status_name',
    ];

    protected static array $statusMap = [
        Sample::STATUS_REGISTERED => '已登记',
        Sample::STATUS_TESTING => '检测中',
        Sample::STATUS_QUALIFIED => '合格',
        Sample::STATUS_UNQUALIFIED => '不合格',
        Sample::STATUS_PROCESSING => '处置中',
        Sample::STATUS_REINSPECTION_APPLIED => '复检申请中',
        Sample::STATUS_RETURNED => '已退回',
        Sample::STATUS_ARCHIVED => '已归档',
    ];

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getOldStatusNameAttribute()
    {
        if (!$this->old_status) {
            return '无';
        }
        return self::$statusMap[$this->old_status] ?? '未知';
    }

    public function getNewStatusNameAttribute()
    {
        return self::$statusMap[$this->new_status] ?? '未知';
    }
}
