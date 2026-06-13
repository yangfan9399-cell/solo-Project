<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    const TYPE_EVIDENCE = 'evidence';
    const TYPE_BUSINESS = 'business';
    const TYPE_SITE = 'site';
    const TYPE_APPEAL = 'appeal';
    const TYPE_OTHER = 'other';

    protected $fillable = [
        'review_record_id',
        'review_node_id',
        'appeal_record_id',
        'discrepancy_record_id',
        'file_name',
        'original_name',
        'file_path',
        'file_type',
        'file_size',
        'mime_type',
        'attachment_type',
        'description',
        'uploaded_by',
    ];

    public function reviewRecord()
    {
        return $this->belongsTo(ReviewRecord::class);
    }

    public function reviewNode()
    {
        return $this->belongsTo(ReviewNode::class);
    }

    public function appealRecord()
    {
        return $this->belongsTo(AppealRecord::class);
    }

    public function discrepancyRecord()
    {
        return $this->belongsTo(DiscrepancyRecord::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getAttachmentTypeLabelAttribute(): string
    {
        $labels = [
            self::TYPE_EVIDENCE => '证据材料',
            self::TYPE_BUSINESS => '业务记录',
            self::TYPE_SITE => '现场说明',
            self::TYPE_APPEAL => '申诉材料',
            self::TYPE_OTHER => '其他',
        ];
        return $labels[$this->attachment_type] ?? $this->attachment_type;
    }

    public function getFileUrlAttribute(): string
    {
        return \Storage::url($this->file_path);
    }

    public function isImage(): bool
    {
        return str_starts_with($this->mime_type ?? '', 'image/');
    }

    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }
}
