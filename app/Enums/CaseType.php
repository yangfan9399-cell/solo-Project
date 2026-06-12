<?php

namespace App\Enums;

enum CaseType: string
{
    case Normal = 'normal';
    case CodeConflict = 'code_conflict';
    case QuantityDiff = 'quantity_diff';
    case Appeal = 'appeal';

    public function label(): string
    {
        return match ($this) {
            self::Normal => '正常归档',
            self::CodeConflict => '编号冲突',
            self::QuantityDiff => '数量/金额差异',
            self::Appeal => '当事人申诉',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Normal => 'green',
            self::CodeConflict => 'red',
            self::QuantityDiff => 'orange',
            self::Appeal => 'purple',
        };
    }
}
