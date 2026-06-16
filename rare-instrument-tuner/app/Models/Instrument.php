<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Instrument extends Model
{
    protected $fillable = [
        'name',
        'type',
        'origin',
        'string_count',
        'tuning_notes',
        'description',
    ];

    protected $casts = [
        'tuning_notes' => 'array',
    ];

    public function tuningSessions(): HasMany
    {
        return $this->hasMany(TuningSession::class);
    }

    public function toneLibraries(): HasMany
    {
        return $this->hasMany(ToneLibrary::class);
    }

    public function practiceRecords(): HasMany
    {
        return $this->hasMany(PracticeRecord::class);
    }
}
