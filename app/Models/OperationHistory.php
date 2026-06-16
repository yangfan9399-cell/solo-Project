<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'operation_type',
        'payload',
        'state_before',
        'state_after',
        'sequence_number',
        'can_undo',
    ];

    protected $casts = [
        'payload' => 'array',
        'state_before' => 'array',
        'state_after' => 'array',
        'can_undo' => 'boolean',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function getOperationTypeLabel(): string
    {
        $labels = [
            'distribute_clue' => '🎴 发放线索',
            'ask_question' => '❓ 提问',
            'advance_round' => '⏭️ 进入下一轮',
            'undo' => '↩️ 撤销操作',
        ];
        return $labels[$this->operation_type] ?? $this->operation_type;
    }
}
