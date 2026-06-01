<?php

class View {
    public static function render($view, $data = []) {
        extract($data);
        
        $flash = $_SESSION['flash'] ?? [];
        $errors = $_SESSION['errors'] ?? [];
        $old = $_SESSION['old'] ?? [];
        
        unset($_SESSION['flash']);
        unset($_SESSION['errors']);
        unset($_SESSION['old']);
        
        $viewPath = str_replace('.', '/', $view);
        $file = ROOT_PATH . "/resources/views/{$viewPath}.php";
        
        if (!file_exists($file)) {
            throw new Exception("View file not found: {$view}");
        }
        
        ob_start();
        include $file;
        $content = ob_get_clean();
        
        include ROOT_PATH . '/resources/views/layouts/app.php';
    }
}
