<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionHistory extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'game_session_id',
        'action_type',
        'before_state',
        'after_state',
        'description',
        'score_change',
        'created_at',
    ];

    protected $casts = [
        'before_state' => 'array',
        'after_state' => 'array',
        'created_at' => 'datetime',
    ];

    public function gameSession(): BelongsTo
    {
        return $this->belongsTo(GameSession::class);
    }

    public function getActionTypeLabelAttribute(): string
    {
        return match ($this->action_type) {
            'rotor_change' => '转轮调整',
            'substitution_add' => '添加替换映射',
            'substitution_remove' => '移除替换映射',
            'note_add' => '添加笔记',
            'hint_use' => '使用提示',
            'undo' => '撤销操作',
            'submit' => '提交解答',
            default => $this->action_type,
        };
    }
}
