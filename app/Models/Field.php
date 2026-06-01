<?php

require_once ROOT_PATH . '/core/Model.php';

class Field extends Model {
    protected $table = 'fields';
    protected $fillable = ['farmer_id', 'name', 'location', 'area', 'crop_type', 'soil_type', 'status', 'notes'];

    public function farmer() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->farmer_id]);
    }

    public function bookings() {
        return $this->db->fetchAll("SELECT * FROM bookings WHERE field_id = ?", [$this->id]);
    }
}
