<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_request_id',
        'result',
        'review_remark',
        'reviewed_by',
    ];

    public function transferRequest(): BelongsTo
    {
        return $this->belongsTo(TransferRequest::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getResultLabelAttribute(): string
    {
        $labels = [
            'approved' => '放行',
            'rejected' => '退回',
            'archived' => '归档',
        ];

        return $labels[$this->result] ?? $this->result;
    }
}
