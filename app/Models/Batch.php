<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Batch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'batch_code',
        'trace_code',
        'seed_type',
        'seed_weight',
        'moisture_content',
        'roasting_temperature',
        'roasting_duration',
        'pressing_pressure',
        'pressing_duration',
        'oil_output',
        'oil_yield_rate',
        'settling_time',
        'sediment_amount',
        'notes',
        'operator',
        'production_date',
        'status',
        'version',
    ];

    protected $attributes = [
        'status' => 'active',
        'version' => 1,
        'sediment_amount' => 0,
    ];

    protected $casts = [
        'production_date' => 'date',
        'seed_weight' => 'decimal:2',
        'moisture_content' => 'decimal:2',
        'roasting_temperature' => 'decimal:2',
        'pressing_pressure' => 'decimal:2',
        'oil_output' => 'decimal:2',
        'oil_yield_rate' => 'decimal:2',
        'sediment_amount' => 'decimal:2',
    ];

    public function versions()
    {
        return $this->hasMany(BatchVersion::class)->orderBy('version_number', 'desc');
    }

    public function anomalies()
    {
        return $this->hasMany(Anomaly::class);
    }

    public function unresolvedAnomalies()
    {
        return $this->anomalies()->where('resolved', false);
    }

    public function getSeedTypeLabelAttribute()
    {
        $types = [
            '花生' => '花生油',
            '菜籽' => '菜籽油',
            '芝麻' => '芝麻油',
            '大豆' => '大豆油',
            '茶籽' => '茶籽油',
            '核桃' => '核桃油',
        ];
        return $types[$this->seed_type] ?? $this->seed_type;
    }
}
