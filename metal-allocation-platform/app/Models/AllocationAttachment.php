<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AllocationAttachment extends Model
{
    protected $fillable = [
        'allocation_id',
        'node_id',
        'file_name',
        'file_path',
        'file_type',
        'uploaded_by',
        'description',
    ];

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(Allocation::class);
    }

    public function node(): BelongsTo
    {
        return $this->belongsTo(AllocationNode::class, 'node_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
