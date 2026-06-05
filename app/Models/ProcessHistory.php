<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ProcessHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'processable_type',
        'processable_id',
        'action',
        'from_status',
        'to_status',
        'remark',
        'performed_by',
    ];

    public function processable(): MorphTo
    {
        return $this->morphTo();
    }

    public function performedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
