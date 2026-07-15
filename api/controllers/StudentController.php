<?php

class StudentController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function myTutors() {
        $user = requireAuth(['student']);
        $stmt = $this->pdo->prepare("
            SELECT DISTINCT u.id as tutor_id, u.username as tutor_name, u.email as tutor_email,
                tp.bio, tp.subjects, tp.hourly_rate
            FROM tutor_enrollments e
            JOIN users u ON u.id=e.tutor_id
            LEFT JOIN tutor_profiles tp ON tp.user_id=u.id
            WHERE e.student_id=?
        ");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }

    public function courses() {
        $user = requireAuth(['student']);
        $stmt = $this->pdo->prepare("
            SELECT tc.*, u.username as tutor_name,
                e.id as enrollment_id, e.fee_paid, e.payment_status, e.payment_ref, e.payment_method, e.created_at as enrolled_at,
                (SELECT COUNT(*) FROM tutor_videos v WHERE v.course_id=tc.id) as video_count,
                (SELECT COUNT(*) FROM tutor_readings r WHERE r.course_id=tc.id) as reading_count
            FROM tutor_enrollments e
            JOIN tutor_courses tc ON tc.id=e.course_id
            JOIN users u ON u.id=e.tutor_id
            WHERE e.student_id=?
            ORDER BY e.enrolled_at DESC
        ");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }

    public function availableCourses() {
        $user = requireAuth(['student']);
        $stmt = $this->pdo->prepare("
            SELECT tc.*, u.username as tutor_name,
                (SELECT COUNT(*) FROM tutor_videos v WHERE v.course_id=tc.id) as video_count,
                (SELECT COUNT(*) FROM tutor_readings r WHERE r.course_id=tc.id) as reading_count
            FROM tutor_courses tc
            JOIN users u ON u.id=tc.tutor_id
            WHERE tc.id NOT IN (
                SELECT course_id FROM tutor_enrollments WHERE student_id=?
            )
            ORDER BY tc.created_at DESC
        ");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }

    public function enroll() {
        $user = requireAuth(['student']);
        $b = getBody();
        $course_id = $b['course_id'];
        
        $stmt = $this->pdo->prepare("SELECT tutor_id FROM tutor_courses WHERE id=?");
        $stmt->execute([$course_id]);
        $course = $stmt->fetch();
        if (!$course) {
            sendError('Course not found', 404);
        }
        
        try {
            $this->pdo->prepare("INSERT INTO tutor_enrollments (tutor_id, student_id, course_id, payment_status, fee_paid) VALUES (?, ?, ?, 'pending', false)")
                ->execute([$course['tutor_id'], $user['id'], $course_id]);
            sendJson(['ok'=>true, 'id'=>$this->pdo->lastInsertId()]);
        } catch (Exception $e) {
            sendError('Already enrolled or error', 400);
        }
    }

    public function payment() {
        $user = requireAuth(['student']);
        $b = getBody();
        $this->pdo->prepare("UPDATE tutor_enrollments SET payment_ref=?,payment_method=?,payment_status='submitted' WHERE id=? AND student_id=?")
            ->execute([$b['payment_ref'],$b['payment_method']??'jazzcash',$b['enrollment_id'],$user['id']]);
        sendJson(['ok'=>true]);
    }

    public function classes() {
        $user = requireAuth(['student']);
        $stmt = $this->pdo->prepare("
            SELECT lc.*, u.username as tutor_name, tc.title as course_title
            FROM tutor_classes lc
            JOIN users u ON u.id=lc.tutor_id
            LEFT JOIN tutor_courses tc ON tc.id=lc.course_id
            WHERE lc.tutor_id IN (SELECT DISTINCT tutor_id FROM tutor_enrollments WHERE student_id=?)
            AND lc.scheduled_at >= NOW() - INTERVAL '1 hour'
            ORDER BY lc.scheduled_at ASC
        ");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }

    public function announcements() {
        $user = requireAuth(['student']);
        $stmt = $this->pdo->prepare("
            SELECT a.*, u.username as tutor_name, tc.title as course_title
            FROM tutor_announcements a
            JOIN users u ON u.id=a.tutor_id
            LEFT JOIN tutor_courses tc ON tc.id=a.course_id
            WHERE a.tutor_id IN (SELECT DISTINCT tutor_id FROM tutor_enrollments WHERE student_id=?)
            ORDER BY a.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }
}
