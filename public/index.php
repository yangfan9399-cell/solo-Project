<?php

session_start();

define('ROOT_PATH', dirname(__DIR__));
define('PUBLIC_PATH', __DIR__);

require_once ROOT_PATH . '/core/Database.php';
require_once ROOT_PATH . '/core/Model.php';
require_once ROOT_PATH . '/core/Controller.php';
require_once ROOT_PATH . '/core/View.php';
require_once ROOT_PATH . '/core/Auth.php';
require_once ROOT_PATH . '/core/helpers.php';

require_once ROOT_PATH . '/routes/web.php';
