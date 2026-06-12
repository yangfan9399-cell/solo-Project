<?php

namespace App\Models;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ToolCase extends Model
{
    protected $table = 'tool_cases';

    protected $fillable = [
        'case_number',
        'title',
        'type',
        'status',
        'source_description',
        'incident_at',
        'location',
        'current_responsible',
        'business_record',
        'scene_description',
        'conclusion',
        'basis',
        'blocking_reason',
        'diff_fields',
        'remedy_path',
        'reported_by',
        'handled_by',
        'reviewed_by',
        'handled_at',
        'reviewed_at',
        'archived_at',
        'is_archived',
    ];

    protected function casts(): array
    {
        return [
            'incident_at' => 'datetime',
            'handled_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'archived_at' => 'datetime',
            'is_archived' => 'boolean',
            'diff_fields' => 'array',
            'status' => CaseStatus::class,
            'type' => CaseType::class,
        ];
    }

    public function tools(): HasMany
    {
        return $this->hasMany(Tool::class, 'case_id');
    }

    public function responsiblePersons(): HasMany
    {
        return $this->hasMany(ResponsiblePerson::class, 'case_id');
    }

    public function nodes(): HasMany
    {
        return $this->hasMany(CaseNode::class, 'case_id')->orderBy('created_at');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class, 'case_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function canEdit(): bool
    {
        return !$this->is_archived;
    }

    public function hasBlocking(): bool
    {
        return !empty($this->blocking_reason) || !empty($this->diff_fields);
    }

    public function summary(): string
    {
        $parts = [$this->case_number, $this->type->label()];
        if ($this->hasBlocking()) {
            $parts[] = '存在异常';
        }
        return implode(' · ', $parts);
    }
}
