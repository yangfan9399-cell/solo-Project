<?php

require_once ROOT_PATH . '/core/Model.php';

class Machine extends Model {
    protected $table = 'machines';
    protected $fillable = ['name', 'type', 'model', 'plate_number', 'operator_id', 'fuel_consumption', 'status', 'notes'];

    public function operator() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->operator_id]);
    }

    public function schedules() {
        return $this->db->fetchAll("SELECT * FROM schedules WHERE machine_id = ?", [$this->id]);
    }

    public static function available() {
        $db = Database::getInstance();
        return $db->fetchAll("SELECT * FROM machines WHERE status = 'available'");
    }

    public static function types() {
        return [
            'tractor' => '拖拉机',
            'harvester' => '收割机',
            'seeder' => '播种机',
            'transplanter' => '插秧机',
        ];
    }
}
