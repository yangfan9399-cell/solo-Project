<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/Field.php';
require_once ROOT_PATH . '/app/Models/User.php';

class BookingController extends Controller {
    public function index() {
        Auth::requireAuth();
        $model = new Booking();
        $bookings = $model->all();
        
        $fieldModel = new Field();
        $fields = [];
        foreach ($fieldModel->all() as $f) {
            $fields[$f['id']] = $f;
        }
        
        $this->view('bookings/index', [
            'bookings' => $bookings,
            'fields' => $fields,
        ]);
    }

    public function create() {
        Auth::requireAuth();
        $fieldModel = new Field();
        $fields = $fieldModel->all();
        
        $this->view('bookings/create', [
            'fields' => $fields,
            'operationTypes' => Booking::operationTypes(),
            'priorities' => Booking::priorities(),
        ]);
    }

    public function store() {
        Auth::requireAuth();
        
        $data = [
            'booking_no' => Booking::generateBookingNo(),
            'farmer_id' => Auth::id(),
            'field_id' => $_POST['field_id'],
            'operation_type' => $_POST['operation_type'],
            'requested_date' => $_POST['requested_date'],
            'area' => $_POST['area'],
            'priority' => $_POST['priority'] ?? 'normal',
            'notes' => $_POST['notes'],
        ];
        
        $model = new Booking();
        $model->create($data);
        
        $this->with('success', '预约提交成功')->redirect('/bookings');
    }

    public function show($id) {
        Auth::requireAuth();
        $model = new Booking();
        $booking = $model->find($id);
        
        $fieldModel = new Field();
        $field = $fieldModel->find($booking['field_id']);
        
        $scheduleModel = new Schedule();
        require_once ROOT_PATH . '/app/Models/Schedule.php';
        $schedule = $scheduleModel->findOneWhere('booking_id', $id);
        
        $this->view('bookings/show', [
            'booking' => $booking,
            'field' => $field,
            'schedule' => $schedule,
        ]);
    }

    public function confirm($id) {
        Auth::requireAuth();
        $model = new Booking();
        $model->update($id, ['status' => 'confirmed']);
        
        $this->with('success', '预约已确认')->redirect('/bookings/' . $id);
    }

    public function cancel($id) {
        Auth::requireAuth();
        $model = new Booking();
        $model->update($id, ['status' => 'cancelled']);
        
        $this->with('success', '预约已取消')->redirect('/bookings/' . $id);
    }
}
