<?php

class TutorController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // POST /api/tutor/register
    public function register() {
        $body = getBody();
        $email = trim($body['email'] ?? '');
        $password = trim($body['password'] ?? '');
        $username = trim($body['username'] ?? '');
        $bio = trim($body['bio'] ?? '');
        $subjects = trim($body['subjects'] ?? '');
        if (!$email || !$password || !$username) sendError('email, password, and username are required');
        $check = $this->pdo->prepare('SELECT id FROM users WHERE email=?');
        $check->execute([$email]);
        if ($check->fetch()) sendError('Email already registered', 409);
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $ins = $this->pdo->prepare("INSERT INTO users(username,email,password_hash,role,must_change_password,created_at) VALUES(?,?,?,'tutor',false,NOW()) RETURNING id");
        $ins->execute([$username, $email, $hash]);
        $uid = $ins->fetch()['id'];
        
        $this->pdo->prepare("INSERT INTO tutor_profiles(user_id,bio,subjects) VALUES(?,?,?)")->execute([$uid,$bio,$subjects]);
        
        $token = bin2hex(random_bytes(32));
        $exp = date('Y-m-d H:i:s', strtotime('+7 days'));
        $this->pdo->prepare("INSERT INTO sessions(user_id,token,expires_at) VALUES(?,?,?)")->execute([$uid,$token,$exp]);
        sendJson(['token'=>$token,'user'=>['id'=>$uid,'username'=>$username,'email'=>$email,'role'=>'tutor','must_change_password'=>false,'permissions'=>[]]], 201);
    }

    // GET /api/tutor/dashboard
    public function dashboard() {
        $user = requireAuth(['tutor','admin']);
        $tid = $user['id'];
        
        $students = $this->pdo->prepare("SELECT COUNT(DISTINCT student_id) as cnt FROM tutor_enrollments WHERE tutor_id=?");
        $students->execute([$tid]); $sc = $students->fetch()['cnt'];
        
        $courses = $this->pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_courses WHERE tutor_id=?");
        $courses->execute([$tid]); $cc = $courses->fetch()['cnt'];
        
        $videos = $this->pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_videos v JOIN tutor_courses c ON v.course_id=c.id WHERE c.tutor_id=?");
        $videos->execute([$tid]); $vc = $videos->fetch()['cnt'];
        
        $classes = $this->pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_classes WHERE tutor_id=? AND scheduled_at > NOW()");
        $classes->execute([$tid]); $lcc = $classes->fetch()['cnt'];
        
        $paid = $this->pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_enrollments WHERE tutor_id=? AND fee_paid=true");
        $paid->execute([$tid]); $pc = $paid->fetch()['cnt'];
        
        $unpaid = $this->pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_enrollments WHERE tutor_id=? AND fee_paid=false");
        $unpaid->execute([$tid]); $upc = $unpaid->fetch()['cnt'];
        
        sendJson(['students'=>$sc,'courses'=>$cc,'videos'=>$vc,'upcoming_classes'=>$lcc,'paid'=>$pc,'unpaid'=>$upc]);
    }

    // GET /api/tutor/profile
    public function getProfile() {
        $user = requireAuth(['tutor']);
        $stmt = $this->pdo->prepare("SELECT tp.*, u.username, u.email FROM tutor_profiles tp JOIN users u ON u.id=tp.user_id WHERE tp.user_id=?");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetch() ?: []);
    }

    // PUT /api/tutor/profile
    public function updateProfile() {
        $user = requireAuth(['tutor']);
        $b = getBody();
        $this->pdo->prepare("UPDATE tutor_profiles SET bio=?,subjects=?,hourly_rate=? WHERE user_id=?")->execute([$b['bio']??'',$b['subjects']??'',$b['hourly_rate']??0,$user['id']]);
        sendJson(['ok'=>true]);
    }
}
