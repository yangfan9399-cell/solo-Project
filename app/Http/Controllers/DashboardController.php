<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/JobRecord.php';
require_once ROOT_PATH . '/app/Models/Subsidy.php';
require_once ROOT_PATH . '/app/Models/Settlement.php';
require_once ROOT_PATH . '/app/Models/ExceptionRecord.php';

class DashboardController extends Controller {
    public function index() {
        Auth::requireAuth();

        $bookingModel = new Booking();
        $scheduleModel = new Schedule();
        $jobModel = new JobRecord();
        $subsidyModel = new Subsidy();
        $settlementModel = new Settlement();
        $exceptionModel = new ExceptionRecord();

        $stats = [
            'total_bookings' => count($bookingModel->all()),
            'pending_bookings' => count($bookingModel->where('status', 'pending')),
            'total_schedules' => count($scheduleModel->all()),
            'today_schedules' => count($scheduleModel->where('scheduled_date', date('Y-m-d'))),
            'total_jobs' => count($jobModel->all()),
            'pending_jobs' => count($jobModel->where('status', 'pending')),
            'total_subsidies' => count($subsidyModel->all()),
            'pending_subsidies' => count($subsidyModel->where('status', 'pending')),
            'total_settlements' => count($settlementModel->all()),
            'unpaid_settlements' => count($settlementModel->where('status', 'unpaid')),
            'open_exceptions' => count($exceptionModel->where('status', 'open')),
        ];

        $recentBookings = array_slice($bookingModel->all(), 0, 5);
        $todaySchedules = $scheduleModel->where('scheduled_date', date('Y-m-d'));

        $this->view('dashboard/index', [
            'stats' => $stats,
            'recentBookings' => $recentBookings,
            'todaySchedules' => $todaySchedules,
        ]);
    }
}
