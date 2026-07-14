<?php
// api/controllers/ActivityLogController.php

require_once __DIR__ . '/../auth/AuthMiddleware.php';

class ActivityLogController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /api/admin/activity-logs
     * Paginated, filterable activity log across all users.
     *
     * Query params: user_id, action, entity_type, date_from, date_to, page, limit
     */
    public function index(): void {
        AuthMiddleware::requireAdmin();

        $page      = max(1, (int)($_GET['page'] ?? 1));
        $limit     = min(100, max(1, (int)($_GET['limit'] ?? 30)));
        $offset    = ($page - 1) * $limit;
        $userId    = $_GET['user_id']   ?? null;
        $action    = $_GET['action']    ?? null;
        $entityType= $_GET['entity_type'] ?? null;
        $dateFrom  = $_GET['date_from'] ?? null;
        $dateTo    = $_GET['date_to']   ?? null;

        $where  = ['1=1'];
        $params = [];

        if ($userId)    { $where[] = 'al.user_id = ?';      $params[] = (int)$userId; }
        if ($action)    { $where[] = 'al.action = ?';       $params[] = $action; }
        if ($entityType){ $where[] = 'al.entity_type = ?';  $params[] = $entityType; }
        if ($dateFrom)  { $where[] = 'al.created_at >= ?';  $params[] = $dateFrom; }
        if ($dateTo)    { $where[] = 'al.created_at <= ?';  $params[] = $dateTo . ' 23:59:59'; }

        $whereClause = implode(' AND ', $where);

        // Count
        $countStmt = $this->pdo->prepare(
            "SELECT COUNT(*) FROM activity_logs al WHERE $whereClause"
        );
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Data
        $dataParams = array_merge($params, [$limit, $offset]);
        $stmt = $this->pdo->prepare("
            SELECT al.*, u.username, u.email
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE $whereClause
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($dataParams);
        $logs = $stmt->fetchAll();

        // Decode metadata JSON
        foreach ($logs as &$log) {
            $log['metadata'] = $log['metadata'] ? json_decode($log['metadata'], true) : null;
        }

        exit(json_encode([
            'data'       => $logs,
            'pagination' => [
                'total'      => $total,
                'page'       => $page,
                'limit'      => $limit,
                'totalPages' => (int)ceil($total / $limit),
            ],
        ]));
    }

    /**
     * GET /api/admin/activity-logs/stats
     * Aggregated stats for the admin dashboard.
     */
    public function stats(): void {
        AuthMiddleware::requireAdmin();

        // Total resources
        $totalRes = (int)$this->pdo->query("SELECT COUNT(*) FROM resources")->fetchColumn();

        // Added this week
        $weekRes = (int)$this->pdo->query("
            SELECT COUNT(*) FROM activity_logs
            WHERE action = 'created' AND entity_type = 'resource'
              AND created_at >= NOW() - INTERVAL '7 days'
        ")->fetchColumn();

        // Active interns count
        $activeInterns = (int)$this->pdo->query(
            "SELECT COUNT(*) FROM users WHERE role = 'intern' AND is_active = TRUE"
        )->fetchColumn();

        $totalInterns = (int)$this->pdo->query(
            "SELECT COUNT(*) FROM users WHERE role = 'intern'"
        )->fetchColumn();

        // Most active intern
        $maStmt = $this->pdo->query("
            SELECT u.username, COUNT(al.id) AS cnt
            FROM activity_logs al
            JOIN users u ON u.id = al.user_id
            WHERE u.role = 'intern'
            GROUP BY u.id, u.username
            ORDER BY cnt DESC
            LIMIT 1
        ");
        $mostActive = $maStmt->fetch();

        // Resources by type
        $rbStmt = $this->pdo->query("SELECT type, COUNT(*) AS cnt FROM resources GROUP BY type");
        $resourcesByType = [];
        foreach ($rbStmt->fetchAll() as $r) {
            $resourcesByType[$r['type']] = (int)$r['cnt'];
        }

        // Total past papers
        $totalPP = (int)$this->pdo->query("SELECT COUNT(*) FROM past_papers")->fetchColumn();

        // Recent activity (last 15 entries)
        $recentStmt = $this->pdo->query("
            SELECT al.*, u.username, u.email
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.user_id
            ORDER BY al.created_at DESC
            LIMIT 15
        ");
        $recent = $recentStmt->fetchAll();
        foreach ($recent as &$r) {
            $r['metadata'] = $r['metadata'] ? json_decode($r['metadata'], true) : null;
        }

        // Intern status list
        $internStmt = $this->pdo->query("
            SELECT u.id, u.username, u.email, u.is_active, u.last_seen,
                   COUNT(DISTINCT CASE
                       WHEN al.action = 'created' AND al.created_at >= NOW() - INTERVAL '1 day'
                       THEN al.id
                   END) AS added_today,
                   COUNT(DISTINCT al.id) AS total_actions
            FROM users u
            LEFT JOIN activity_logs al ON al.user_id = u.id
            WHERE u.role = 'intern'
            GROUP BY u.id
            ORDER BY u.last_seen DESC NULLS LAST
        ");
        $internList = $internStmt->fetchAll();

        // Resources by subject (for bar chart)
        $bySubjectStmt = $this->pdo->query("
            SELECT s.name AS subject, COUNT(r.id) AS count
            FROM resources r
            JOIN subjects s ON s.id = r.subject_id
            GROUP BY s.id, s.name
            ORDER BY count DESC
            LIMIT 10
        ");

        exit(json_encode([
            'total_resources'   => $totalRes,
            'added_this_week'   => $weekRes,
            'active_interns'    => $activeInterns,
            'total_interns'     => $totalInterns,
            'total_past_papers' => $totalPP,
            'most_active_intern'=> $mostActive ?: null,
            'resources_by_type' => $resourcesByType,
            'resources_by_subject' => $bySubjectStmt->fetchAll(),
            'recent_activity'   => $recent,
            'intern_list'       => $internList,
        ]));
    }

    /**
     * GET /api/admin/users/:id/activity
     * Activity log for a specific intern.
     */
    public function byUser(int $userId): void {
        AuthMiddleware::requireAdmin();

        $page   = max(1, (int)($_GET['page'] ?? 1));
        $limit  = min(100, max(1, (int)($_GET['limit'] ?? 30)));
        $offset = ($page - 1) * $limit;
        $action     = $_GET['action']     ?? null;
        $entityType = $_GET['entity_type']?? null;
        $dateFrom   = $_GET['date_from']  ?? null;
        $dateTo     = $_GET['date_to']    ?? null;

        $where  = ['al.user_id = ?'];
        $params = [$userId];

        if ($action)    { $where[] = 'al.action = ?';       $params[] = $action; }
        if ($entityType){ $where[] = 'al.entity_type = ?';  $params[] = $entityType; }
        if ($dateFrom)  { $where[] = 'al.created_at >= ?';  $params[] = $dateFrom; }
        if ($dateTo)    { $where[] = 'al.created_at <= ?';  $params[] = $dateTo . ' 23:59:59'; }

        $whereClause = implode(' AND ', $where);

        $countStmt = $this->pdo->prepare("SELECT COUNT(*) FROM activity_logs al WHERE $whereClause");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();

        // Stats for the intern
        $statsStmt = $this->pdo->prepare("
            SELECT
                COUNT(*) FILTER (WHERE action = 'created') AS total_created,
                COUNT(*) FILTER (WHERE action = 'updated') AS total_updated,
                COUNT(*) FILTER (WHERE action = 'created' AND created_at >= NOW() - INTERVAL '7 days') AS added_this_week,
                MAX(created_at) AS last_activity
            FROM activity_logs
            WHERE user_id = ?
        ");
        $statsStmt->execute([$userId]);
        $stats = $statsStmt->fetch();

        $dataParams = array_merge($params, [$limit, $offset]);
        $stmt = $this->pdo->prepare("
            SELECT al.*, u.username, u.email
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE $whereClause
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute($dataParams);
        $logs = $stmt->fetchAll();

        foreach ($logs as &$log) {
            $log['metadata'] = $log['metadata'] ? json_decode($log['metadata'], true) : null;
        }

        exit(json_encode([
            'stats'      => $stats,
            'data'       => $logs,
            'pagination' => [
                'total'      => $total,
                'page'       => $page,
                'limit'      => $limit,
                'totalPages' => (int)ceil($total / $limit),
            ],
        ]));
    }
}
