<?php

if (!function_exists('format_number')) {
    function format_number($value, int $decimals = 2): string
    {
        return number_format((float)$value, $decimals, '.', '');
    }
}

if (!function_exists('anomaly_badge_class')) {
    function anomaly_badge_class(string $type): string
    {
        return match ($type) {
            'high' => 'bg-red-100 text-red-800 border-red-200',
            'medium' => 'bg-orange-100 text-orange-800 border-orange-200',
            'low' => 'bg-yellow-100 text-yellow-800 border-yellow-200',
            default => 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
}

if (!function_exists('anomaly_badge_label')) {
    function anomaly_badge_label(string $type): string
    {
        return match ($type) {
            'high' => '严重',
            'medium' => '中等',
            'low' => '轻微',
            default => '未知',
        };
    }
}

if (!function_exists('status_badge_class')) {
    function status_badge_class(string $status): string
    {
        return match ($status) {
            'active' => 'bg-green-100 text-green-800 border-green-200',
            'archived' => 'bg-gray-100 text-gray-800 border-gray-200',
            default => 'bg-gray-100 text-gray-800 border-gray-200',
        };
    }
}

if (!function_exists('status_badge_label')) {
    function status_badge_label(string $status): string
    {
        return match ($status) {
            'active' => '活跃',
            'archived' => '已归档',
            default => '未知',
        };
    }
}

if (!function_exists('field_label')) {
    function field_label(string $field): string
    {
        $labels = [
            'batch_code' => '批次编号',
            'trace_code' => '溯源码',
            'seed_type' => '油料种类',
            'seed_weight' => '原料重量',
            'moisture_content' => '原料水分含量',
            'roasting_temperature' => '炒籽温度',
            'roasting_duration' => '炒籽时长',
            'pressing_pressure' => '压榨压力',
            'pressing_duration' => '压榨时长',
            'oil_output' => '出油量',
            'oil_yield_rate' => '出油率',
            'settling_time' => '沉淀时间',
            'sediment_amount' => '沉淀物量',
            'notes' => '备注',
            'operator' => '操作员',
            'production_date' => '生产日期',
            'status' => '状态',
            'version' => '版本号',
        ];
        return $labels[$field] ?? $field;
    }
}

if (!function_exists('field_unit')) {
    function field_unit(string $field): string
    {
        $units = [
            'seed_weight' => 'kg',
            'moisture_content' => '%',
            'roasting_temperature' => '℃',
            'roasting_duration' => '分钟',
            'pressing_pressure' => 'MPa',
            'pressing_duration' => '分钟',
            'oil_output' => 'L',
            'oil_yield_rate' => '%',
            'settling_time' => '小时',
            'sediment_amount' => 'kg',
        ];
        return $units[$field] ?? '';
    }
}
