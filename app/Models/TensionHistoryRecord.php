<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TensionHistoryRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'drum_master_record_id',
        'rope_tension',
        'tension_unit',
        'measurement_point',
        'tuning_key_turns',
        'operator',
        'is_rollback',
        'rollback_from_id',
        'adjustment_reason',
        'measured_at',
    ];

    protected $casts = [
        'rope_tension' => 'float',
        'tuning_key_turns' => 'float',
        'is_rollback' => 'boolean',
        'measured_at' => 'datetime',
    ];

    public function drumMasterRecord(): BelongsTo
    {
        return $this->belongsTo(DrumMasterRecord::class);
    }

    public function rollbackFrom(): BelongsTo
    {
        return $this->belongsTo(TensionHistoryRecord::class, 'rollback_from_id');
    }
}
