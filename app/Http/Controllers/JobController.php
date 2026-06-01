<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/JobRecord.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/User.php';

class JobController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new JobRecord();
        $jobs = $model->all();
        
        $this->view('jobs/index', [
            'jobs' => $jobs,
        ]);
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new JobRecord();
        $job = $model->find($id);
        
        $scheduleModel = new Schedule();
        $schedule = $scheduleModel->find($job['schedule_id']);
        
        $bookingModel = new Booking();
        $booking = $bookingModel->find($schedule['booking_id']);
        
        $this->view('jobs/show', [
            'job' => $job,
            'schedule' => $schedule,
            'booking' => $booking,
        ]);
    }

    public function approve($id) {
        Auth::requireAuth();
        $model = new JobRecord();
        $model->update($id, [
            'status' => 'approved',
            'inspector_id' => Auth::id(),
            'inspection_notes' => $_POST['inspection_notes'],
            'inspected_at' => date('Y-m-d H:i:s'),
        ]);
        
        $this->with('success', '作业验收通过')->redirect('/jobs/' . $id);
    }

    public function reject($id) {
        Auth::requireAuth();
        $model = new JobRecord();
        $model->update($id, [
            'status' => 'rejected',
            'inspector_id' => Auth::id(),
            'inspection_notes' => $_POST['inspection_notes'],
            'inspected_at' => date('Y-m-d H:i:s'),
        ]);
        
        $this->with('success', '作业验收驳回')->redirect('/jobs/' . $id);
    }
}
