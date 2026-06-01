<?php

require_once ROOT_PATH . '/core/Model.php';

class ExceptionRecord extends Model {
    protected $table = 'exceptions';
    protected $fillable = ['exception_no', 'schedule_id', 'job_record_id', 'reporter_id', 'type', 'title', 'description', 'status', 'handler_id', 'resolution', 'resolved_at'];

    public function schedule() {
        return $this->db->fetchOne("SELECT * FROM schedules WHERE id = ?", [$this->schedule_id]);
    }

    public function jobRecord() {
        return $this->db->fetchOne("SELECT * FROM job_records WHERE id = ?", [$this->job_record_id]);
    }

    public function reporter() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->reporter_id]);
    }

    public function handler() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->handler_id]);
    }

    public static function generateExceptionNo() {
        return 'EXC' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    public static function types() {
        return [
            'machine_failure' => '机械故障',
            'weather' => '天气原因',
            'personnel' => '人员问题',
            'material' => '物料问题',
            'other' => '其他',
        ];
    }

    public static function statusLabels() {
        return [
            'open' => '待处理',
            'in_progress' => '处理中',
            'resolved' => '已解决',
            'closed' => '已关闭',
        ];
    }
}
