<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TensionTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'drum_master_record_id',
        'table_name',
        'table_version',
        'measurement_point',
        'tension_value',
        'frequency',
        'deviation',
        'is_rollback',
        'rollback_from_id',
        'calculation_note',
    ];

    protected $casts = [
        'tension_value' => 'float',
        'frequency' => 'float',
        'deviation' => 'float',
        'is_rollback' => 'boolean',
    ];

    public function drumMasterRecord(): BelongsTo
    {
        return $this->belongsTo(DrumMasterRecord::class);
    }

    public function rollbackFrom(): BelongsTo
    {
        return $this->belongsTo(TensionTable::class, 'rollback_from_id');
    }
}
