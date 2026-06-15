<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TuningComparison extends Model
{
    use HasFactory;

    protected $fillable = [
        'comparison_name',
        'description',
        'master_record_ids',
        'status',
        'comparison_result',
        'conclusion',
        'recommended_scheme',
        'completed_at',
    ];

    protected $casts = [
        'master_record_ids' => 'array',
        'comparison_result' => 'array',
        'completed_at' => 'datetime',
    ];

    public function getMasterRecordsAttribute()
    {
        $ids = $this->master_record_ids ?? [];
        return DrumMasterRecord::whereIn('id', $ids)->get();
    }
}
