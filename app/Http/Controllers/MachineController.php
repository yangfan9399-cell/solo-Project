<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Machine.php';
require_once ROOT_PATH . '/app/Models/User.php';

class MachineController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Machine();
        $machines = $model->all();
        
        $this->view('machines/index', [
            'machines' => $machines,
        ]);
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new Machine();
        $machine = $model->find($id);
        
        $scheduleModel = new Schedule();
        require_once ROOT_PATH . '/app/Models/Schedule.php';
        $schedules = $scheduleModel->where('machine_id', $id);
        
        $this->view('machines/show', [
            'machine' => $machine,
            'schedules' => $schedules,
        ]);
    }
}
