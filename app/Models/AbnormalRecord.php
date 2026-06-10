<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AbnormalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'follow_up_id',
        'type',
        'description',
        'reviewer_id',
        'review_status',
        'review_notes',
    ];

    public function followUp()
    {
        return $this->belongsTo(FollowUp::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
