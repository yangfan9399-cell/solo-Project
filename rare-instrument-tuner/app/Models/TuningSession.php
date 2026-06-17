<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TuningSession extends Model
{
    protected $fillable = [
        'instrument_id',
        'name',
        'audio_path',
        'fundamental_freq',
        'status',
        'notes',
        'has_anomaly',
        'anomaly_description',
    ];

    protected $casts = [
        'has_anomaly' => 'boolean',
    ];

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'draft' => '草稿',
            'in_progress' => '进行中',
            'completed' => '已完成',
            default => $this->status ?? '未知',
        };
    }

    public function getStatusBadgeClassAttribute(): string
    {
        return match ($this->status) {
            'completed' => 'bg-green-100 text-green-700',
            'in_progress' => 'bg-yellow-100 text-yellow-700',
            default => 'bg-gray-100 text-gray-600',
        };
    }

    public function instrument(): BelongsTo
    {
        return $this->belongsTo(Instrument::class);
    }

    public function spectrumData(): HasMany
    {
        return $this->hasMany(SpectrumData::class);
    }

    public function tuningSuggestions(): HasMany
    {
        return $this->hasMany(TuningSuggestion::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(SessionVersion::class);
    }

    public function practiceRecords(): HasMany
    {
        return $this->hasMany(PracticeRecord::class);
    }

    public function createVersion(string $changeDescription = ''): SessionVersion
    {
        $snapshotData = [
            'name' => $this->name,
            'fundamental_freq' => $this->fundamental_freq,
            'status' => $this->status,
            'notes' => $this->notes,
            'has_anomaly' => $this->has_anomaly,
            'anomaly_description' => $this->anomaly_description,
            'spectrum_data' => $this->spectrumData()->get()->toArray(),
            'suggestions' => $this->tuningSuggestions()->get()->toArray(),
        ];

        $lastVersion = $this->versions()->orderByDesc('version_number')->first();
        $versionNumber = $lastVersion ? $lastVersion->version_number + 1 : 1;

        return $this->versions()->create([
            'version_number' => $versionNumber,
            'snapshot_data' => $snapshotData,
            'change_description' => $changeDescription,
        ]);
    }
}
