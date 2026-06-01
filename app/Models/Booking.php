<?php

require_once ROOT_PATH . '/core/Model.php';

class Booking extends Model {
    protected $table = 'bookings';
    protected $fillable = ['booking_no', 'farmer_id', 'field_id', 'operation_type', 'requested_date', 'area', 'area_status', 'confirmed_area', 'status', 'priority', 'notes'];

    public function farmer() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->farmer_id]);
    }

    public function field() {
        return $this->db->fetchOne("SELECT * FROM fields WHERE id = ?", [$this->field_id]);
    }

    public function schedule() {
        return $this->db->fetchOne("SELECT * FROM schedules WHERE booking_id = ?", [$this->id]);
    }

    public static function generateBookingNo() {
        return 'BK' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    public static function operationTypes() {
        return [
            'plowing' => '耕地',
            'planting' => '播种',
            'harvesting' => '收割',
            'irrigation' => '灌溉',
            'fertilizing' => '施肥',
            'pest_control' => '病虫害防治',
        ];
    }

    public static function statusLabels() {
        return [
            'pending' => '待确认',
            'confirmed' => '已确认',
            'scheduled' => '已排班',
            'in_progress' => '作业中',
            'completed' => '已完成',
            'cancelled' => '已取消',
        ];
    }

    public static function priorities() {
        return [
            'low' => '低',
            'normal' => '普通',
            'high' => '高',
            'urgent' => '紧急',
        ];
    }

    public static function areaStatusLabels() {
        return [
            'pending' => '待确认',
            'confirmed' => '已确认',
            'mismatch' => '面积差异',
            'rejected' => '待修正',
        ];
    }
}
