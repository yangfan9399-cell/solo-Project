<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Material extends Model
{
    protected $fillable = [
        'type',
        'name',
        'cost',
        'durability',
        'compatibility',
        'batch_code',
        'is_defective',
        'defect_description',
    ];

    protected $casts = [
        'compatibility' => 'array',
        'is_defective' => 'boolean',
    ];

    public function isCompatibleWith(Material $other): bool
    {
        if (!$this->compatibility) {
            return true;
        }
        return in_array($other->id, $this->compatibility);
    }
}
