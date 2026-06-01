<?php

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

$routes = [
    'GET' => [],
    'POST' => [],
    'PUT' => [],
    'DELETE' => [],
];

function route($method, $path, $handler) {
    global $routes;
    $routes[$method][$path] = $handler;
}

function get($path, $handler) { route('GET', $path, $handler); }
function post($path, $handler) { route('POST', $path, $handler); }
function put($path, $handler) { route('PUT', $path, $handler); }
function delete($path, $handler) { route('DELETE', $path, $handler); }

function dispatch($uri, $method) {
    global $routes;
    
    if (isset($routes[$method][$uri])) {
        $handler = $routes[$method][$uri];
        if (is_string($handler)) {
            list($controller, $action) = explode('@', $handler);
            require_once ROOT_PATH . "/app/Http/Controllers/{$controller}.php";
            $instance = new $controller();
            $instance->$action();
        } else {
            $handler();
        }
        return;
    }
    
    foreach ($routes[$method] as $path => $handler) {
        $pattern = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '([a-zA-Z0-9_]+)', $path);
        if (preg_match("#^{$pattern}$#", $uri, $matches)) {
            array_shift($matches);
            if (is_string($handler)) {
                list($controller, $action) = explode('@', $handler);
                require_once ROOT_PATH . "/app/Http/Controllers/{$controller}.php";
                $instance = new $controller();
                call_user_func_array([$instance, $action], $matches);
            } else {
                call_user_func_array($handler, $matches);
            }
            return;
        }
    }
    
    http_response_code(404);
    echo "404 Not Found";
}

get('/', 'HomeController@index');

get('/login', 'AuthController@showLogin');
post('/login', 'AuthController@login');
get('/logout', 'AuthController@logout');

get('/dashboard', 'DashboardController@index');

get('/bookings', 'BookingController@index');
get('/bookings/create', 'BookingController@create');
post('/bookings', 'BookingController@store');
get('/bookings/{id}', 'BookingController@show');
post('/bookings/{id}/confirm', 'BookingController@confirm');
post('/bookings/{id}/cancel', 'BookingController@cancel');
post('/bookings/{id}/confirm-area', 'BookingController@confirmArea');
post('/bookings/{id}/request-area-correction', 'BookingController@requestAreaCorrection');

get('/fields', 'FieldController@index');
get('/fields/create', 'FieldController@create');
post('/fields', 'FieldController@store');
get('/fields/{id}', 'FieldController@show');

get('/machines', 'MachineController@index');
get('/machines/{id}', 'MachineController@show');

get('/schedules', 'ScheduleController@index');
get('/schedules/calendar', 'ScheduleController@calendar');
post('/schedules', 'ScheduleController@store');
post('/schedules/{id}/delete', 'ScheduleController@destroy');

get('/assignments', 'AssignmentController@index');
post('/assignments/{id}/checkin', 'AssignmentController@checkin');
post('/assignments/{id}/checkout', 'AssignmentController@checkout');

get('/jobs', 'JobController@index');
get('/jobs/{id}', 'JobController@show');
post('/jobs/{id}/approve', 'JobController@approve');
post('/jobs/{id}/reject', 'JobController@reject');

get('/subsidies', 'SubsidyController@index');
get('/subsidies/create', 'SubsidyController@create');
post('/subsidies', 'SubsidyController@store');
get('/subsidies/{id}', 'SubsidyController@show');
post('/subsidies/{id}/calculate', 'SubsidyController@calculate');
post('/subsidies/{id}/settle', 'SettlementController@generateSettlement');

get('/settlements', 'SettlementController@index');
get('/settlements/{id}', 'SettlementController@show');
post('/settlements/{id}/pay', 'SettlementController@pay');

get('/exceptions', 'ExceptionController@index');
get('/exceptions/create', 'ExceptionController@create');
post('/exceptions', 'ExceptionController@store');
get('/exceptions/{id}', 'ExceptionController@show');
post('/exceptions/{id}/resolve', 'ExceptionController@resolve');

get('/unauthorized', function() {
    echo "未授权访问";
});

dispatch($uri, $method);
