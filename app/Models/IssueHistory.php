<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IssueHistory extends Model
{
    use HasFactory;

    protected $fillable = ['issue_id', 'action', 'operator_id', 'note'];

    public function issue()
    {
        return $this->belongsTo(InspectionIssue::class);
    }

    public function operator()
    {
        return $this->belongsTo(User::class, 'operator_id');
    }
}