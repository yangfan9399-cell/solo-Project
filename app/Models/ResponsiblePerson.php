<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResponsiblePerson extends Model
{
    protected $table = 'responsible_persons';

    protected $fillable = [
        'case_id',
        'name',
        'employee_id',
        'department',
        'role_in_case',
        'appeal_content',
        'appealed_at',
    ];

    protected function casts(): array
    {
        return [
            'appealed_at' => 'datetime',
        ];
    }

    public function toolCase(): BelongsTo
    {
        return $this->belongsTo(ToolCase::class, 'case_id');
    }

    public function hasAppealed(): bool
    {
        return !empty($this->appeal_content);
    }
}
