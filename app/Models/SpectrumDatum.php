<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SpectrumDatum extends Model
{
    use HasFactory;

    protected $table = 'spectrum_data';

    protected $fillable = [
        'tuning_result_record_id',
        'frequency',
        'amplitude',
        'phase',
        'is_harmonic',
        'harmonic_order',
    ];

    protected $casts = [
        'frequency' => 'float',
        'amplitude' => 'float',
        'phase' => 'float',
        'is_harmonic' => 'boolean',
    ];

    public function tuningResultRecord(): BelongsTo
    {
        return $this->belongsTo(TuningResultRecord::class);
    }
}
