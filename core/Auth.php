<?php

class Auth {
    public static function check() {
        return isset($_SESSION['user']);
    }

    public static function user() {
        return $_SESSION['user'] ?? null;
    }

    public static function id() {
        return $_SESSION['user']['id'] ?? null;
    }

    public static function role() {
        return $_SESSION['user']['role'] ?? null;
    }

    public static function isFarmer() {
        return self::role() === 'farmer';
    }

    public static function isOperator() {
        return self::role() === 'operator';
    }

    public static function isFinance() {
        return self::role() === 'finance';
    }

    public static function isAdmin() {
        return self::role() === 'admin';
    }

    public static function login($user) {
        $_SESSION['user'] = $user;
    }

    public static function logout() {
        unset($_SESSION['user']);
        session_destroy();
    }

    public static function requireAuth() {
        if (!self::check()) {
            header('Location: /login');
            exit;
        }
    }

    public static function requireRole($role) {
        self::requireAuth();
        if (self::role() !== $role && self::role() !== 'admin') {
            header('Location: /unauthorized');
            exit;
        }
    }

    public static function requireRoles($roles) {
        self::requireAuth();
        if (!in_array(self::role(), $roles) && self::role() !== 'admin') {
            header('Location: /unauthorized');
            exit;
        }
    }
}
