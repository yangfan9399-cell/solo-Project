<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
    <?php echo vite(['resources/js/app.js', 'resources/css/app.css']); ?>
    <?php echo app('Tightenco\Ziggy\BladeRouteGenerator')->generate(); ?>
</head>
<body class="font-sans antialiased">
    <?php echo inertia_head(); ?>
    <div id="app" data-page="<?php echo e($page); ?>"></div>
</body>
</html>
