<?php

class Controller {
    protected function view($view, $data = []) {
        View::render($view, $data);
    }

    protected function redirect($url) {
        header("Location: {$url}");
        exit;
    }

    protected function back() {
        $this->redirect($_SERVER['HTTP_REFERER'] ?? '/');
    }

    protected function with($key, $message) {
        $_SESSION['flash'][$key] = $message;
        return $this;
    }

    protected function withErrors($errors) {
        $_SESSION['errors'] = $errors;
        $_SESSION['old'] = $_POST;
        return $this;
    }

    protected function json($data) {
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
