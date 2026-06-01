<?php

require_once ROOT_PATH . '/core/Model.php';

class Subsidy extends Model {
    protected $table = 'subsidies';
    protected $fillable = ['subsidy_no', 'job_record_id', 'operation_type', 'area', 'fuel_subsidy_rate', 'fuel_subsidy_amount', 'operation_subsidy_rate', 'operation_subsidy_amount', 'total_subsidy', 'status', 'approved_by', 'approved_at', 'notes'];

    public function jobRecord() {
        return $this->db->fetchOne("SELECT * FROM job_records WHERE id = ?", [$this->job_record_id]);
    }

    public function approvedBy() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->approved_by]);
    }

    public function settlement() {
        return $this->db->fetchOne("SELECT * FROM settlements WHERE subsidy_id = ?", [$this->id]);
    }

    public static function generateSubsidyNo() {
        return 'SUB' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    public static function calculate($jobRecordId, $fuelRate = 10, $operationRate = 20) {
        $db = Database::getInstance();
        $jobRecord = $db->fetchOne("SELECT * FROM job_records WHERE id = ?", [$jobRecordId]);
        
        if (!$jobRecord) {
            return [
                'area' => 0,
                'fuel_used' => 0,
                'fuel_subsidy_rate' => $fuelRate,
                'fuel_subsidy_amount' => 0,
                'operation_subsidy_rate' => $operationRate,
                'operation_subsidy_amount' => 0,
                'total_subsidy' => 0,
                'operation_type' => null,
            ];
        }
        
        $schedule = $db->fetchOne("SELECT * FROM schedules WHERE id = ?", [$jobRecord['schedule_id']]);
        $booking = $schedule ? $db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$schedule['booking_id']]) : null;

        $area = $booking['confirmed_area'] ?? ($jobRecord['actual_area'] ?? ($booking['area'] ?? 0));
        $fuelUsed = $jobRecord['fuel_used'] ?? 0;

        $fuelSubsidy = $fuelUsed * $fuelRate;
        $operationSubsidy = $area * $operationRate;
        $total = $fuelSubsidy + $operationSubsidy;

        return [
            'area' => $area,
            'fuel_used' => $fuelUsed,
            'fuel_subsidy_rate' => $fuelRate,
            'fuel_subsidy_amount' => $fuelSubsidy,
            'operation_subsidy_rate' => $operationRate,
            'operation_subsidy_amount' => $operationSubsidy,
            'total_subsidy' => $total,
            'operation_type' => $booking['operation_type'] ?? null,
        ];
    }

    public static function statusLabels() {
        return [
            'pending' => '待审核',
            'approved' => '已通过',
            'rejected' => '已驳回',
        ];
    }
}
