<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TuningResultRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'drum_master_record_id',
        'strike_frequency',
        'target_frequency',
        'performance_environment',
        'ambient_temp',
        'ambient_humidity',
        'ambient_pressure',
        'performance_notes',
        'sound_quality_assessment',
        'spectrum_anomaly',
        'anomaly_type',
        'anomaly_description',
    ];

    protected $casts = [
        'strike_frequency' => 'float',
        'target_frequency' => 'float',
        'ambient_temp' => 'float',
        'ambient_humidity' => 'float',
        'ambient_pressure' => 'float',
        'spectrum_anomaly' => 'boolean',
    ];

    public function drumMasterRecord(): BelongsTo
    {
        return $this->belongsTo(DrumMasterRecord::class);
    }

    public function spectrumData(): HasMany
    {
        return $this->hasMany(SpectrumDatum::class);
    }

    public function getFundamentalFrequencyAttribute()
    {
        return $this->spectrumData()
            ->orderBy('amplitude', 'desc')
            ->first()?->frequency;
    }

    public function getHarmonicsAttribute()
    {
        return $this->spectrumData()
            ->where('is_harmonic', true)
            ->orderBy('harmonic_order')
            ->get();
    }
}
