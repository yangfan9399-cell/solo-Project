<?php

require_once ROOT_PATH . '/core/Model.php';

class User extends Model {
    protected $table = 'users';
    protected $fillable = ['name', 'email', 'password', 'role', 'phone', 'address'];

    public static function authenticate($email, $password) {
        $db = Database::getInstance();
        $user = $db->fetchOne("SELECT * FROM users WHERE email = ? AND password = ?", [$email, $password]);
        return $user;
    }

    public function fields() {
        return $this->db->fetchAll("SELECT * FROM fields WHERE farmer_id = ?", [$this->id]);
    }

    public function machines() {
        return $this->db->fetchAll("SELECT * FROM machines WHERE operator_id = ?", [$this->id]);
    }

    public function bookings() {
        return $this->db->fetchAll("SELECT * FROM bookings WHERE farmer_id = ? ORDER BY created_at DESC", [$this->id]);
    }

    public function schedules() {
        return $this->db->fetchAll("SELECT * FROM schedules WHERE operator_id = ? ORDER BY scheduled_date DESC", [$this->id]);
    }

    public static function farmers() {
        $db = Database::getInstance();
        return $db->fetchAll("SELECT * FROM users WHERE role = 'farmer'");
    }

    public static function operators() {
        $db = Database::getInstance();
        return $db->fetchAll("SELECT * FROM users WHERE role = 'operator'");
    }
}
