<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionResult extends Model
{
    protected $fillable = [
        'sample_id',
        'inspector_id',
        'inspection_date',
        'indicators',
        'result',
        'conclusion',
        'report_file',
    ];

    protected $casts = [
        'inspection_date' => 'date',
        'indicators' => 'array',
    ];

    const RESULT_QUALIFIED = 'qualified';
    const RESULT_PESTICIDE_EXCEEDED = 'pesticide_exceeded';
    const RESULT_OTHER_UNQUALIFIED = 'other_unqualified';

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function getResultNameAttribute()
    {
        return match ($this->result) {
            self::RESULT_QUALIFIED => '合格',
            self::RESULT_PESTICIDE_EXCEEDED => '农残超标',
            self::RESULT_OTHER_UNQUALIFIED => '其他不合格',
            default => '未知',
        };
    }

    public function isQualified()
    {
        return $this->result === self::RESULT_QUALIFIED;
    }

    public function isPesticideExceeded()
    {
        return $this->result === self::RESULT_PESTICIDE_EXCEEDED;
    }
}
