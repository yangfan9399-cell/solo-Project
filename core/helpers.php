<?php

function old($key, $default = '') {
    return $_SESSION['old'][$key] ?? $default;
}

function flash($key) {
    return $_SESSION['flash'][$key] ?? null;
}

function e($value) {
    return htmlspecialchars($value ?? '', ENT_QUOTES);
}

function asset($path) {
    return "/{$path}";
}

function url($path) {
    return "/{$path}";
}

function formatDate($date, $format = 'Y-m-d') {
    if (!$date) return '';
    return date($format, strtotime($date));
}

function formatDateTime($datetime, $format = 'Y-m-d H:i') {
    if (!$datetime) return '';
    return date($format, strtotime($datetime));
}

function formatMoney($amount) {
    return '¥' . number_format($amount ?? 0, 2);
}

function formatArea($area) {
    return number_format($area ?? 0, 2) . ' 亩';
}

function statusBadge($status, $labels = []) {
    $colors = [
        'pending' => 'bg-yellow-100 text-yellow-800',
        'confirmed' => 'bg-blue-100 text-blue-800',
        'scheduled' => 'bg-purple-100 text-purple-800',
        'in_progress' => 'bg-green-100 text-green-800',
        'completed' => 'bg-gray-100 text-gray-800',
        'approved' => 'bg-green-100 text-green-800',
        'rejected' => 'bg-red-100 text-red-800',
        'cancelled' => 'bg-red-100 text-red-800',
        'paid' => 'bg-green-100 text-green-800',
        'unpaid' => 'bg-orange-100 text-orange-800',
    ];
    
    $label = $labels[$status] ?? $status;
    $color = $colors[$status] ?? 'bg-gray-100 text-gray-800';
    
    return "<span class=\"px-2 py-1 text-xs font-medium rounded-full {$color}\">{$label}</span>";
}

function roleLabel($role) {
    $labels = [
        'admin' => '管理员',
        'farmer' => '农户',
        'operator' => '农机手',
        'finance' => '财务',
    ];
    return $labels[$role] ?? $role;
}
