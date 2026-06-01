<?php

require_once ROOT_PATH . '/core/Model.php';

class JobRecord extends Model {
    protected $table = 'job_records';
    protected $fillable = ['schedule_id', 'checkin_time', 'checkout_time', 'actual_area', 'fuel_used', 'quality_rating', 'status', 'inspector_id', 'inspection_notes', 'inspected_at'];

    public function schedule() {
        return $this->db->fetchOne("SELECT * FROM schedules WHERE id = ?", [$this->schedule_id]);
    }

    public function inspector() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->inspector_id]);
    }

    public function subsidy() {
        return $this->db->fetchOne("SELECT * FROM subsidies WHERE job_record_id = ?", [$this->id]);
    }

    public function exceptions() {
        return $this->db->fetchAll("SELECT * FROM exceptions WHERE job_record_id = ?", [$this->id]);
    }

    public static function statusLabels() {
        return [
            'pending' => '待验收',
            'approved' => '已通过',
            'rejected' => '已驳回',
            'in_progress' => '作业中',
        ];
    }
}
