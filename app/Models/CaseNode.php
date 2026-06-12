<?php

namespace App\Models;

use App\Enums\NodeType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CaseNode extends Model
{
    protected $table = 'case_nodes';

    protected $fillable = [
        'case_id',
        'node_type',
        'status',
        'content',
        'snapshot',
        'changes',
        'operator_id',
        'operator_name',
        'operator_role',
    ];

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'changes' => 'array',
            'node_type' => NodeType::class,
        ];
    }

    public function toolCase(): BelongsTo
    {
        return $this->belongsTo(ToolCase::class, 'case_id');
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}
