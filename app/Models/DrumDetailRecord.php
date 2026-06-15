<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DrumDetailRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'drum_master_record_id',
        'drumhead_material',
        'drumhead_brand',
        'drumhead_thickness',
        'drum_side',
        'sort_order',
    ];

    protected $casts = [
        'drumhead_thickness' => 'float',
    ];

    public function drumMasterRecord(): BelongsTo
    {
        return $this->belongsTo(DrumMasterRecord::class);
    }
}
