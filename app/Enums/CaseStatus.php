<?php

namespace App\Enums;

enum CaseStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Reviewing = 'reviewing';
    case Returned = 'returned';
    case Blocked = 'blocked';
    case Appealing = 'appealing';
    case Archived = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Pending => '待受理',
            self::Processing => '处理中',
            self::Reviewing => '复核中',
            self::Returned => '退回补证',
            self::Blocked => '异常阻断',
            self::Appealing => '申诉中',
            self::Archived => '已归档',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'gray',
            self::Processing => 'blue',
            self::Reviewing => 'yellow',
            self::Returned => 'orange',
            self::Blocked => 'red',
            self::Appealing => 'purple',
            self::Archived => 'green',
        };
    }
}
