<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/JobRecord.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/Machine.php';
require_once ROOT_PATH . '/app/Models/User.php';

class AssignmentController extends Controller {
    public function index() {
        Auth::requireAuth();
        
        $model = new Schedule();
        $schedules = $model->where('status', 'scheduled');
        
        $this->view('assignments/index', [
            'schedules' => $schedules,
        ]);
    }

    public function checkin($id) {
        Auth::requireAuth();
        
        $scheduleModel = new Schedule();
        $schedule = $scheduleModel->find($id);
        
        if (!$schedule) {
            $this->with('error', '排班不存在')->redirect('/assignments');
        }
        
        $jobModel = new JobRecord();
        $jobId = $jobModel->create([
            'schedule_id' => $id,
            'checkin_time' => date('Y-m-d H:i:s'),
            'status' => 'in_progress',
        ]);
        
        $scheduleModel->update($id, ['status' => 'in_progress']);
        
        $this->with('success', '签到成功')->redirect('/assignments');
    }

    public function checkout($id) {
        Auth::requireAuth();
        
        $jobModel = new JobRecord();
        $job = $jobModel->findOneWhere('schedule_id', $id);
        
        if (!$job) {
            $this->with('error', '作业记录不存在')->redirect('/assignments');
        }
        
        $jobModel->update($job['id'], [
            'checkout_time' => date('Y-m-d H:i:s'),
            'actual_area' => $_POST['actual_area'],
            'fuel_used' => $_POST['fuel_used'],
            'quality_rating' => $_POST['quality_rating'],
            'status' => 'pending',
        ]);
        
        $scheduleModel = new Schedule();
        $scheduleModel->update($id, ['status' => 'completed']);
        
        $bookingModel = new Booking();
        $schedule = $scheduleModel->find($id);
        
        if ($schedule) {
            $bookingModel->update($schedule['booking_id'], ['status' => 'completed']);
        }
        
        $this->with('success', '签退成功，作业已完成')->redirect('/assignments');
    }
}
