<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TuningSuggestion extends Model
{
    protected $fillable = [
        'tuning_session_id',
        'string_index',
        'current_freq',
        'target_freq',
        'adjustment_cents',
        'action',
        'note',
    ];

    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            'adjust' => '调弦',
            'compensate' => '补偿',
            'wait' => '等待',
            'note' => '备注',
            default => $this->action ?? '未知',
        };
    }

    public function getActionBadgeClassAttribute(): string
    {
        return match ($this->action) {
            'adjust' => 'bg-blue-100 text-blue-700',
            'compensate' => 'bg-purple-100 text-purple-700',
            'wait' => 'bg-yellow-100 text-yellow-700',
            'note' => 'bg-orange-100 text-orange-700',
            default => 'bg-gray-100 text-gray-600',
        };
    }

    public function tuningSession(): BelongsTo
    {
        return $this->belongsTo(TuningSession::class);
    }
}
