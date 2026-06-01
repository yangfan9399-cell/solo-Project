<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Subsidy.php';
require_once ROOT_PATH . '/app/Models/JobRecord.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/User.php';

class SubsidyController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Subsidy();
        $subsidies = $model->all();
        
        $this->view('subsidies/index', [
            'subsidies' => $subsidies,
        ]);
    }

    public function create() {
        Auth::requireAuth();
        
        $jobModel = new JobRecord();
        $jobs = $jobModel->where('status', 'approved');
        
        $this->view('subsidies/create', [
            'jobs' => $jobs,
        ]);
    }

    public function store() {
        Auth::requireAuth();
        
        $jobRecordId = $_POST['job_record_id'];
        $calculated = Subsidy::calculate($jobRecordId);
        
        $data = array_merge($calculated, [
            'subsidy_no' => Subsidy::generateSubsidyNo(),
            'job_record_id' => $jobRecordId,
            'notes' => $_POST['notes'],
        ]);
        
        $model = new Subsidy();
        $model->create($data);
        
        $this->with('success', '油补核算成功')->redirect('/subsidies');
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new Subsidy();
        $subsidy = $model->find($id);
        
        if (!$subsidy) {
            $this->with('error', '油补核算记录不存在')->redirect('/subsidies');
        }
        
        $jobModel = new JobRecord();
        $job = $jobModel->find($subsidy['job_record_id']) ?: [];
        
        $this->view('subsidies/show', [
            'subsidy' => $subsidy,
            'job' => $job,
        ]);
    }

    public function calculate($id) {
        Auth::requireAuth();
        $result = Subsidy::calculate($id);
        $this->json($result);
    }
}
