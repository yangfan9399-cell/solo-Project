<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/ExceptionRecord.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/JobRecord.php';
require_once ROOT_PATH . '/app/Models/User.php';

class ExceptionController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new ExceptionRecord();
        $exceptions = $model->all();
        
        $this->view('exceptions/index', [
            'exceptions' => $exceptions,
        ]);
    }

    public function create() {
        Auth::requireAuth();
        
        $scheduleModel = new Schedule();
        $schedules = $scheduleModel->all();
        
        $this->view('exceptions/create', [
            'schedules' => $schedules,
            'types' => ExceptionRecord::types(),
        ]);
    }

    public function store() {
        Auth::requireAuth();
        
        $data = [
            'exception_no' => ExceptionRecord::generateExceptionNo(),
            'schedule_id' => $_POST['schedule_id'] ?: null,
            'job_record_id' => $_POST['job_record_id'] ?: null,
            'reporter_id' => Auth::id(),
            'type' => $_POST['type'],
            'title' => $_POST['title'],
            'description' => $_POST['description'],
        ];
        
        $model = new ExceptionRecord();
        $model->create($data);
        
        $this->with('success', '异常反馈提交成功')->redirect('/exceptions');
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new ExceptionRecord();
        $exception = $model->find($id);
        
        if (!$exception) {
            $this->with('error', '异常记录不存在')->redirect('/exceptions');
        }
        
        $this->view('exceptions/show', [
            'exception' => $exception,
        ]);
    }

    public function resolve($id) {
        Auth::requireAuth();
        $model = new ExceptionRecord();
        $exception = $model->find($id);
        
        if (!$exception) {
            $this->with('error', '异常记录不存在')->redirect('/exceptions');
        }
        
        $model->update($id, [
            'status' => 'resolved',
            'handler_id' => Auth::id(),
            'resolution' => $_POST['resolution'],
            'resolved_at' => date('Y-m-d H:i:s'),
        ]);
        
        $this->with('success', '异常已解决')->redirect('/exceptions/' . $id);
    }
}
