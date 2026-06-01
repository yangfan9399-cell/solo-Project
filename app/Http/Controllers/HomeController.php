<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/Booking.php';
require_once ROOT_PATH . '/app/Models/Schedule.php';
require_once ROOT_PATH . '/app/Models/Subsidy.php';

class HomeController extends Controller {
    public function index() {
        if (Auth::check()) {
            $this->redirect('/dashboard');
        }
        $this->view('home/index');
    }
}
