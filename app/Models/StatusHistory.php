<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StatusHistory extends Model
{
    protected $table = 'status_history';

    protected $fillable = [
        'sample_id',
        'user_id',
        'old_status',
        'new_status',
        'note',
    ];

    public function sample(): BelongsTo
    {
        return $this->belongsTo(Sample::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getOldStatusNameAttribute()
    {
        return $this->old_status ? Sample::where('status', $this->old_status)->first()?->status_name ?? '未知' : '无';
    }

    public function getNewStatusNameAttribute()
    {
        return Sample::where('status', $this->new_status)->first()?->status_name ?? '未知';
    }
}
