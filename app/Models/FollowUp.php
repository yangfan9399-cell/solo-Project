<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FollowUp extends Model
{
    use HasFactory;

    protected $fillable = [
        'surgery_id',
        'nurse_id',
        'follow_up_date',
        'type',
        'notes',
        'status',
    ];

    public function surgery()
    {
        return $this->belongsTo(Surgery::class);
    }

    public function nurse()
    {
        return $this->belongsTo(User::class, 'nurse_id');
    }

    public function abnormalRecords()
    {
        return $this->hasMany(AbnormalRecord::class);
    }
}
