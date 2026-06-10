<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InspectionIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id', 'problem_type_id', 'description', 'status',
        'reporter_id', 'rectifier_id', 'reviewer_id', 'closer_id',
        'deadline', 'rectify_note', 'review_note', 'close_note', 'photos'
    ];

    protected $casts = [
        'deadline' => 'datetime',
        'photos' => 'array'
    ];

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function problemType()
    {
        return $this->belongsTo(ProblemType::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reporter_id');
    }

    public function rectifier()
    {
        return $this->belongsTo(User::class, 'rectifier_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function closer()
    {
        return $this->belongsTo(User::class, 'closer_id');
    }

    public function histories()
    {
        return $this->hasMany(IssueHistory::class)->orderBy('created_at', 'asc');
    }

    public function isOverdue()
    {
        return $this->deadline && now()->gt($this->deadline);
    }

    public function hasPhotos()
    {
        return !empty($this->photos);
    }
}