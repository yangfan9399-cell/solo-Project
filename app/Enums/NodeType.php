<?php

namespace App\Enums;

enum NodeType: string
{
    case Report = 'report';
    case Accept = 'accept';
    case Process = 'process';
    case Review = 'review';
    case Return = 'return';
    case Appeal = 'appeal';
    case Archive = 'archive';
    case Reopen = 'reopen';
    case Update = 'update';

    public function label(): string
    {
        return match ($this) {
            self::Report => '受理登记',
            self::Accept => '受理确认',
            self::Process => '处理提交',
            self::Review => '复核审批',
            self::Return => '退回补证',
            self::Appeal => '当事人申诉',
            self::Archive => '归档',
            self::Reopen => '重新处理',
            self::Update => '信息更新',
        };
    }
}
