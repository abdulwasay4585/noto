<?php
require_once __DIR__ . '/Router.php';
require_once __DIR__ . '/controllers/TutorController.php';
require_once __DIR__ . '/controllers/AuthController.php';

$router = new Router($pdo);

// Explicit routes for Auth
$router->post('/auth/register', 'AuthController@register');

// Tutor routes that don't easily fit auto-routing
$router->post('/tutor/register', 'TutorController@register');
$router->get('/tutor/dashboard', 'TutorController@dashboard');
$router->get('/tutor/profile', 'TutorController@getProfile');
$router->put('/tutor/profile', 'TutorController@updateProfile');

// Dispatch
$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// We can return true if a route was found, or false if we want index.php to handle it.
// For now, if the router handles it, it will output JSON and exit (since controllers call sendJson).
// We should modify Router dispatch to return boolean so index.php knows.
