<?php

namespace App\Enums;

enum UserRole: string
{
    case Clerk = 'clerk';
    case Approver = 'approver';

    public function label(): string
    {
        return match ($this) {
            self::Clerk => '业务专员',
            self::Approver => '审批负责人',
        };
    }
}
