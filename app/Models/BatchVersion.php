<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BatchVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'version_number',
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
        'change_summary',
        'changed_by',
        'changed_fields',
    ];

    protected $casts = [
        'production_date' => 'date',
        'changed_fields' => 'json',
        'seed_weight' => 'decimal:2',
        'moisture_content' => 'decimal:2',
        'roasting_temperature' => 'decimal:2',
        'pressing_pressure' => 'decimal:2',
        'oil_output' => 'decimal:2',
        'oil_yield_rate' => 'decimal:2',
        'sediment_amount' => 'decimal:2',
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function toArrayForComparison()
    {
        return [
            'seed_type' => $this->seed_type,
            'seed_weight' => (float)$this->seed_weight,
            'moisture_content' => (float)$this->moisture_content,
            'roasting_temperature' => (float)$this->roasting_temperature,
            'roasting_duration' => $this->roasting_duration,
            'pressing_pressure' => (float)$this->pressing_pressure,
            'pressing_duration' => $this->pressing_duration,
            'oil_output' => (float)$this->oil_output,
            'oil_yield_rate' => (float)$this->oil_yield_rate,
            'settling_time' => $this->settling_time,
            'sediment_amount' => (float)$this->sediment_amount,
            'notes' => $this->notes,
            'operator' => $this->operator,
            'production_date' => $this->production_date?->toDateString(),
        ];
    }
}
