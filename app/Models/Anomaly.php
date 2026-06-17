<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Anomaly extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'field_name',
        'anomaly_type',
        'anomaly_code',
        'description',
        'actual_value',
        'min_threshold',
        'max_threshold',
        'suggestion',
        'resolution_notes',
        'resolved',
    ];

    protected $casts = [
        'actual_value' => 'decimal:2',
        'min_threshold' => 'decimal:2',
        'max_threshold' => 'decimal:2',
        'resolved' => 'boolean',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function getTypeColorAttribute()
    {
        return match ($this->anomaly_type) {
            'low' => 'warning',
            'medium' => 'orange',
            'high' => 'danger',
            default => 'info',
        };
    }

    public function getTypeLabelAttribute()
    {
        return match ($this->anomaly_type) {
            'low' => '轻微',
            'medium' => '中等',
            'high' => '严重',
            default => '未知',
        };
    }
}
