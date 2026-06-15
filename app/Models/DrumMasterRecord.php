<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class DrumMasterRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'batch_number',
        'version',
        'drum_diameter',
        'musician_name',
        'record_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'drum_diameter' => 'float',
        'record_date' => 'date',
    ];

    public function detailRecords(): HasMany
    {
        return $this->hasMany(DrumDetailRecord::class);
    }

    public function tensionHistoryRecords(): HasMany
    {
        return $this->hasMany(TensionHistoryRecord::class);
    }

    public function tuningResultRecords(): HasMany
    {
        return $this->hasMany(TuningResultRecord::class);
    }

    public function tensionTables(): HasMany
    {
        return $this->hasMany(TensionTable::class);
    }

    public function latestResult(): HasOne
    {
        return $this->hasOne(TuningResultRecord::class)->latestOfMany();
    }

    public function currentTensionTable(): HasOne
    {
        return $this->hasOne(TensionTable::class)
            ->where('is_rollback', false)
            ->latestOfMany();
    }
}
