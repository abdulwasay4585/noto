<?php
// api/controllers/UserController.php

require_once __DIR__ . '/../auth/AuthMiddleware.php';
require_once __DIR__ . '/../services/ActivityLogger.php';

class UserController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /api/admin/users
     * Returns all intern accounts with stats.
     */
    public function index(): void {
        AuthMiddleware::requireAdmin();

        $stmt = $this->pdo->query("
            SELECT u.id, u.username, u.email, u.role, u.is_active,
                   u.created_at, u.last_login, u.last_seen, u.must_change_password,
                   creator.username AS created_by_username,
                   COUNT(DISTINCT al.id) AS total_actions,
                   COUNT(DISTINCT CASE WHEN al.action = 'created' THEN al.id END) AS resources_added
            FROM users u
            LEFT JOIN users creator ON u.created_by = creator.id
            LEFT JOIN activity_logs al ON al.user_id = u.id
            WHERE u.role = 'intern'
            GROUP BY u.id, creator.username
            ORDER BY u.created_at DESC
        ");
        exit(json_encode($stmt->fetchAll()));
    }

    /**
     * POST /api/admin/users
     * Creates a new intern account with initial permissions.
     */
    public function create(): void {
        $admin = AuthMiddleware::requireAdmin();
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];

        $username = trim($body['username'] ?? '');
        $email    = trim($body['email'] ?? '');
        $password = $body['temporary_password'] ?? '';
        $perms    = $body['permissions'] ?? [];

        if (!$username || !$email || !$password) {
            http_response_code(400);
            exit(json_encode(['error' => 'username, email and temporary_password are required']));
        }
        if (strlen($password) < 8) {
            http_response_code(400);
            exit(json_encode(['error' => 'Password must be at least 8 characters']));
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

        try {
            $stmt = $this->pdo->prepare("
                INSERT INTO users (username, email, password_hash, role, is_active, created_by, must_change_password)
                VALUES (?, ?, ?, 'intern', TRUE, ?, TRUE)
                RETURNING id
            ");
            $stmt->execute([$username, $email, $hash, (int)$admin['user_id']]);
            $newId = (int)$stmt->fetchColumn();

            // Insert default permissions
            $defaultTypes = ['resources', 'past_papers', 'subjects', 'categories'];
            $pStmt = $this->pdo->prepare("
                INSERT INTO intern_permissions
                    (user_id, resource_type, can_read, can_write, can_edit, can_delete, updated_by)
                VALUES (?, ?, ?, ?, ?, FALSE, ?)
                ON CONFLICT (user_id, resource_type)
                DO UPDATE SET can_read = EXCLUDED.can_read, can_write = EXCLUDED.can_write,
                              can_edit = EXCLUDED.can_edit, updated_by = EXCLUDED.updated_by,
                              updated_at = NOW()
            ");
            foreach ($defaultTypes as $rt) {
                $rtPerms = $perms[$rt] ?? ['can_read' => true, 'can_write' => false, 'can_edit' => false];
                $pStmt->execute([
                    $newId,
                    $rt,
                    (int)(bool)($rtPerms['can_read'] ?? true),
                    (int)(bool)($rtPerms['can_write'] ?? false),
                    (int)(bool)($rtPerms['can_edit'] ?? false),
                    (int)$admin['user_id'],
                ]);
            }

            ActivityLogger::log(
                (int)$admin['user_id'],
                'created',
                'intern_account',
                $newId,
                $username,
                ['email' => $email]
            );

            exit(json_encode(['id' => $newId, 'success' => true]));
        } catch (PDOException $e) {
            if ($e->getCode() === '23505') {
                http_response_code(409);
                exit(json_encode(['error' => 'Username or email already exists']));
            }
            throw $e;
        }
    }

    /**
     * PATCH /api/admin/users/:id
     * Toggle active status or reset password.
     */
    public function update(int $id): void {
        $admin = AuthMiddleware::requireAdmin();
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];

        $updates = [];
        $params  = [];

        if (isset($body['is_active'])) {
            $updates[] = 'is_active = ?';
            $params[]  = (bool)$body['is_active'];
        }

        if (isset($body['new_password'])) {
            if (strlen($body['new_password']) < 8) {
                http_response_code(400);
                exit(json_encode(['error' => 'Password must be at least 8 characters']));
            }
            $updates[] = 'password_hash = ?';
            $updates[] = 'must_change_password = TRUE';
            $params[]  = password_hash($body['new_password'], PASSWORD_BCRYPT, ['cost' => 12]);
        }

        if (isset($body['username'])) {
            $updates[] = 'username = ?';
            $params[]  = trim($body['username']);
        }

        if (empty($updates)) {
            http_response_code(400);
            exit(json_encode(['error' => 'No valid fields to update']));
        }

        $params[] = $id;
        $this->pdo->prepare("UPDATE users SET " . implode(', ', $updates) . " WHERE id = ? AND role = 'intern'")
                  ->execute($params);

        ActivityLogger::log(
            (int)$admin['user_id'],
            'updated',
            'intern_account',
            $id,
            null,
            ['changed_fields' => array_keys($body)]
        );

        exit(json_encode(['success' => true]));
    }

    /**
     * DELETE /api/admin/users/:id
     * Permanently removes an intern account.
     */
    public function delete(int $id): void {
        $admin = AuthMiddleware::requireAdmin();
        $this->pdo->prepare("DELETE FROM users WHERE id = ? AND role = 'intern'")->execute([$id]);
        ActivityLogger::log((int)$admin['user_id'], 'deleted', 'intern_account', $id, null, []);
        exit(json_encode(['success' => true]));
    }
}
