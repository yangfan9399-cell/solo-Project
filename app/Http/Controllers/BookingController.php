<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/Field.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
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
        
        if (!$booking) {
            $this->with('error', '预约不存在')->redirect('/bookings');
        }
        
        $fieldModel = new Field();
        $field = $fieldModel->find($booking['field_id']) ?: [];
        
        $scheduleModel = new Schedule();
        $schedule = $scheduleModel->findOneWhere('booking_id', $id) ?: null;
        
        $this->view('bookings/show', [
            'booking' => $booking,
            'field' => $field,
            'schedule' => $schedule,
        ]);
    }

    public function confirm($id) {
        Auth::requireAuth();
        $model = new Booking();
        $booking = $model->find($id);
        if (!$booking) {
            $this->with('error', '预约不存在')->redirect('/bookings');
        }
        $model->update($id, ['status' => 'confirmed']);
        $this->with('success', '预约已确认')->redirect('/bookings/' . $id);
    }

    public function confirmArea($id) {
        Auth::requireAuth();
        $model = new Booking();
        $booking = $model->find($id);
        if (!$booking) {
            $this->with('error', '预约不存在')->redirect('/bookings');
        }
        if (($booking['area_status'] ?? '') === 'confirmed') {
            $this->with('error', '面积已确认，无需重复操作')->redirect('/bookings/' . $id);
        }
        $confirmedArea = $_POST['confirmed_area'] ?? $booking['area'];
        $model->update($id, [
            'area_status' => 'confirmed',
            'confirmed_area' => $confirmedArea,
        ]);
        $this->with('success', '面积已确认，锁定为 ' . formatArea($confirmedArea))->redirect('/bookings/' . $id);
    }

    public function requestAreaCorrection($id) {
        Auth::requireAuth();
        $model = new Booking();
        $booking = $model->find($id);
        if (!$booking) {
            $this->with('error', '预约不存在')->redirect('/bookings');
        }
        $correctionNote = $_POST['correction_note'] ?? '';
        $model->update($id, [
            'area_status' => 'rejected',
        ]);
        $this->with('success', '已要求修正面积，等待农户重新提交')->redirect('/bookings/' . $id);
    }

    public function cancel($id) {
        Auth::requireAuth();
        $model = new Booking();
        $model->update($id, ['status' => 'cancelled']);
        
        $this->with('success', '预约已取消')->redirect('/bookings/' . $id);
    }
}
