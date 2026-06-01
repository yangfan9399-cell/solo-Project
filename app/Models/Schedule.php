<?php

require_once ROOT_PATH . '/core/Model.php';

class Schedule extends Model {
    protected $table = 'schedules';
    protected $fillable = ['booking_id', 'machine_id', 'operator_id', 'scheduled_date', 'start_time', 'end_time', 'status', 'notes'];

    public function booking() {
        return $this->db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$this->booking_id]);
    }

    public function machine() {
        return $this->db->fetchOne("SELECT * FROM machines WHERE id = ?", [$this->machine_id]);
    }

    public function operator() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->operator_id]);
    }

    public function jobRecord() {
        return $this->db->fetchOne("SELECT * FROM job_records WHERE schedule_id = ?", [$this->id]);
    }

    public function exceptions() {
        return $this->db->fetchAll("SELECT * FROM exceptions WHERE schedule_id = ?", [$this->id]);
    }

    public static function getByDate($date) {
        $db = Database::getInstance();
        return $db->fetchAll("SELECT * FROM schedules WHERE scheduled_date = ?", [$date]);
    }

    public static function getByDateRange($startDate, $endDate) {
        $db = Database::getInstance();
        return $db->fetchAll("SELECT * FROM schedules WHERE scheduled_date BETWEEN ? AND ?", [$startDate, $endDate]);
    }

    public static function statusLabels() {
        return [
            'scheduled' => '已排班',
            'in_progress' => '作业中',
            'completed' => '已完成',
            'cancelled' => '已取消',
        ];
    }
}
