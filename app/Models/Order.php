<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'plate_id',
        'order_number',
        'book_title',
        'customer_name',
        'quantity',
        'order_date',
        'delivery_date',
        'status',
        'unit_price',
        'remark',
    ];

    protected $casts = [
        'order_date' => 'date',
        'delivery_date' => 'date',
        'unit_price' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function plate(): BelongsTo
    {
        return $this->belongsTo(Plate::class);
    }

    public function getTotalAmountAttribute(): ?float
    {
        if ($this->unit_price === null) return null;
        return round($this->quantity * $this->unit_price, 2);
    }

    public function getStatusBadgeClassAttribute(): string
    {
        return match ($this->status) {
            '进行中' => 'bg-blue-100 text-blue-800',
            '已完成' => 'bg-green-100 text-green-800',
            '已取消' => 'bg-gray-100 text-gray-800',
            '已延期' => 'bg-red-100 text-red-800',
            default => 'bg-yellow-100 text-yellow-800',
        };
    }
}
