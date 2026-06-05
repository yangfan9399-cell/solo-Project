<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ManifestForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'manifest_number',
        'transfer_request_id',
        'issue_date',
        'manifest_document',
        'status',
        'verification_remark',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'verified_at' => 'datetime',
    ];

    public function transferRequest(): BelongsTo
    {
        return $this->belongsTo(TransferRequest::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'pending' => '待确认',
            'verified' => '已确认',
            'rejected' => '已拒绝',
        ];

        return $labels[$this->status] ?? $this->status;
    }
}
