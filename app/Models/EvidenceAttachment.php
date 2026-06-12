<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EvidenceAttachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inspection_record_id',
        'record_node_id',
        'attachment_type',
        'file_name',
        'file_path',
        'file_size',
        'file_mime',
        'description',
        'uploaded_by',
        'uploaded_at',
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];

    public const TYPE_PHOTO = 'photo';
    public const TYPE_VIDEO = 'video';
    public const TYPE_DOCUMENT = 'document';
    public const TYPE_OTHER = 'other';

    public const TYPE_LABELS = [
        self::TYPE_PHOTO => '照片',
        self::TYPE_VIDEO => '视频',
        self::TYPE_DOCUMENT => '文档',
        self::TYPE_OTHER => '其他',
    ];

    public function inspectionRecord(): BelongsTo
    {
        return $this->belongsTo(InspectionRecord::class);
    }

    public function recordNode(): BelongsTo
    {
        return $this->belongsTo(RecordNode::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->attachment_type] ?? $this->attachment_type;
    }

    public function getFileUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }
}
