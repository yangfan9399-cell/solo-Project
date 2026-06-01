<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/Machine.php';
require_once ROOT_PATH . '/app/Models/User.php';

class ScheduleController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Schedule();
        $schedules = $model->all();
        
        $this->view('schedules/index', [
            'schedules' => $schedules,
        ]);
    }

    public function calendar() {
        Auth::requireAuth();
        $model = new Schedule();
        
        $month = $_GET['month'] ?? date('Y-m');
        $startDate = $month . '-01';
        $endDate = date('Y-m-t', strtotime($startDate));
        
        $schedules = $model->getByDateRange($startDate, $endDate);
        
        $calendar = [];
        $daysInMonth = date('t', strtotime($startDate));
        for ($i = 1; $i <= $daysInMonth; $i++) {
            $date = $month . '-' . str_pad($i, 2, '0', STR_PAD_LEFT);
            $calendar[$date] = [];
        }
        
        foreach ($schedules as $s) {
            $calendar[$s['scheduled_date']][] = $s;
        }
        
        $this->view('schedules/calendar', [
            'calendar' => $calendar,
            'month' => $month,
            'prevMonth' => date('Y-m', strtotime('-1 month', strtotime($startDate))),
            'nextMonth' => date('Y-m', strtotime('+1 month', strtotime($startDate))),
        ]);
    }

    public function store() {
        Auth::requireAuth();

        $bookingModel = new Booking();
        $booking = $bookingModel->find($_POST['booking_id']);

        if (!$booking) {
            $this->with('error', '预约不存在')->redirect('/schedules');
        }

        if (($booking['area_status'] ?? '') !== 'confirmed') {
            $this->with('error', '该预约面积尚未确认，请先确认面积后再排班')->redirect('/bookings/' . $booking['id']);
        }
        
        $data = [
            'booking_id' => $_POST['booking_id'],
            'machine_id' => $_POST['machine_id'],
            'operator_id' => $_POST['operator_id'],
            'scheduled_date' => $_POST['scheduled_date'],
            'start_time' => $_POST['start_time'],
            'end_time' => $_POST['end_time'],
            'notes' => $_POST['notes'],
        ];
        
        $model = new Schedule();
        $model->create($data);
        
        $bookingModel->update($_POST['booking_id'], ['status' => 'scheduled']);
        
        $this->with('success', '排班成功')->redirect('/schedules');
    }

    public function destroy($id) {
        Auth::requireAuth();
        $model = new Schedule();
        $schedule = $model->find($id);
        
        if (!$schedule) {
            $this->with('error', '排班不存在')->redirect('/schedules');
        }
        
        $bookingId = $schedule['booking_id'];
        $model->delete($id);
        
        $bookingModel = new Booking();
        $bookingModel->update($bookingId, ['status' => 'confirmed']);
        
        $this->with('success', '排班已取消')->redirect('/schedules');
    }
}
