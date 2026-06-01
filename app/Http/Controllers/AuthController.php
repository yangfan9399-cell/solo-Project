<?php

require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/app/Models/User.php';

class AuthController extends Controller {
    public function showLogin() {
        if (Auth::check()) {
            $this->redirect('/dashboard');
        }
        $this->view('auth/login');
    }

    public function login() {
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        $user = User::authenticate($email, $password);

        if ($user) {
            Auth::login($user);
            $this->redirect('/dashboard');
        } else {
            $this->withErrors(['email' => '邮箱或密码错误'])->back();
        }
    }

    public function logout() {
        Auth::logout();
        $this->redirect('/');
    }
}
