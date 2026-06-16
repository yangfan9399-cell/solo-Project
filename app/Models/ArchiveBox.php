<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchiveBox extends Model
{
    protected $fillable = [
        'level_id',
        'label',
        'era',
        'classification',
        'correct_floor',
        'color',
        'sort_order',
    ];

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }
}
