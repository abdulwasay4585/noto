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

// We will call dispatch in index.php
// Student routes
require_once __DIR__ . '/controllers/StudentController.php';
$router->get('/student/my-tutors', 'StudentController@myTutors');
$router->get('/student/courses', 'StudentController@courses');
$router->get('/student/available-courses', 'StudentController@availableCourses');
$router->post('/student/enroll', 'StudentController@enroll');
$router->post('/student/payment', 'StudentController@payment');
$router->get('/student/classes', 'StudentController@classes');
$router->get('/student/announcements', 'StudentController@announcements');

// Resource routes
require_once __DIR__ . '/controllers/ResourceController.php';
$router->get('/categories', 'ResourceController@getCategories');
$router->get('/subjects', 'ResourceController@getSubjects');
$router->get('/resources', 'ResourceController@getResources');
$router->get('/resources/{id}', 'ResourceController@getResource');
