<?php

require_once ROOT_PATH . '/core/Model.php';

class Settlement extends Model {
    protected $table = 'settlements';
    protected $fillable = ['settlement_no', 'farmer_id', 'subsidy_id', 'operation_fee', 'fuel_cost', 'subsidy_amount', 'total_amount', 'status', 'paid_at', 'payment_method', 'transaction_no', 'notes'];

    public function farmer() {
        return $this->db->fetchOne("SELECT * FROM users WHERE id = ?", [$this->farmer_id]);
    }

    public function subsidy() {
        return $this->db->fetchOne("SELECT * FROM subsidies WHERE id = ?", [$this->subsidy_id]);
    }

    public static function generateSettlementNo() {
        return 'SET' . date('Ymd') . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    public static function calculate($subsidyId, $operationFeeRate = 30, $fuelCostRate = 8) {
        $db = Database::getInstance();
        $subsidy = $db->fetchOne("SELECT * FROM subsidies WHERE id = ?", [$subsidyId]);
        $jobRecord = $db->fetchOne("SELECT * FROM job_records WHERE id = ?", [$subsidy['job_record_id']]);
        $schedule = $db->fetchOne("SELECT * FROM schedules WHERE id = ?", [$jobRecord['schedule_id']]);
        $booking = $db->fetchOne("SELECT * FROM bookings WHERE id = ?", [$schedule['booking_id']]);

        $area = $subsidy['area'];
        $fuelUsed = $jobRecord['fuel_used'] ?? 0;

        $operationFee = $area * $operationFeeRate;
        $fuelCost = $fuelUsed * $fuelCostRate;
        $subsidyAmount = $subsidy['total_subsidy'];
        $total = $operationFee + $fuelCost - $subsidyAmount;

        return [
            'farmer_id' => $booking['farmer_id'],
            'operation_fee' => $operationFee,
            'fuel_cost' => $fuelCost,
            'subsidy_amount' => $subsidyAmount,
            'total_amount' => max(0, $total),
        ];
    }

    public static function statusLabels() {
        return [
            'unpaid' => '待支付',
            'paid' => '已支付',
            'cancelled' => '已取消',
        ];
    }

    public static function paymentMethods() {
        return [
            'cash' => '现金',
            'bank_transfer' => '银行转账',
            'wechat' => '微信支付',
            'alipay' => '支付宝',
        ];
    }
}
