<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Field.php';
require_once ROOT_PATH . '/app/Models/User.php';

class FieldController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Field();
        $fields = $model->all();
        
        $this->view('fields/index', [
            'fields' => $fields,
        ]);
    }

    public function create() {
        Auth::requireAuth();
        $this->view('fields/create');
    }

    public function store() {
        Auth::requireAuth();
        
        $data = [
            'farmer_id' => Auth::id(),
            'name' => $_POST['name'],
            'location' => $_POST['location'],
            'area' => $_POST['area'],
            'crop_type' => $_POST['crop_type'],
            'soil_type' => $_POST['soil_type'],
            'notes' => $_POST['notes'],
        ];
        
        $model = new Field();
        $model->create($data);
        
        $this->with('success', '地块添加成功')->redirect('/fields');
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new Field();
        $field = $model->find($id);
        
        $bookingModel = new Booking();
        require_once ROOT_PATH . '/app/Models/Booking.php';
        $bookings = $bookingModel->where('field_id', $id);
        
        $this->view('fields/show', [
            'field' => $field,
            'bookings' => $bookings,
        ]);
    }
}
