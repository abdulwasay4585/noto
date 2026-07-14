<?php
// api/controllers/PermissionController.php

require_once __DIR__ . '/../auth/AuthMiddleware.php';
require_once __DIR__ . '/../services/ActivityLogger.php';

class PermissionController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * GET /api/admin/users/:id/permissions
     * Returns all permission records for a given intern.
     */
    public function show(int $userId): void {
        AuthMiddleware::requireAdmin();

        $stmt = $this->pdo->prepare(
            "SELECT resource_type, can_read, can_write, can_edit
             FROM intern_permissions WHERE user_id = ?"
        );
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();

        $permissions = [];
        foreach ($rows as $row) {
            $permissions[$row['resource_type']] = [
                'can_read'  => (bool)$row['can_read'],
                'can_write' => (bool)$row['can_write'],
                'can_edit'  => (bool)$row['can_edit'],
                'can_delete'=> false, // always false for interns
            ];
        }

        exit(json_encode($permissions));
    }

    /**
     * PUT /api/admin/users/:id/permissions
     * Replaces all permission records for a given intern.
     *
     * Body: {
     *   "resources":   { "can_read": true, "can_write": true, "can_edit": false },
     *   "past_papers": { ... },
     *   ...
     * }
     */
    public function update(int $userId): void {
        $admin = AuthMiddleware::requireAdmin();
        $body  = json_decode(file_get_contents('php://input'), true) ?? [];

        $allowedTypes = ['resources', 'past_papers', 'subjects', 'categories'];

        $stmt = $this->pdo->prepare("
            INSERT INTO intern_permissions
                (user_id, resource_type, can_read, can_write, can_edit, can_delete, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, FALSE, ?, NOW())
            ON CONFLICT (user_id, resource_type)
            DO UPDATE SET
                can_read   = EXCLUDED.can_read,
                can_write  = EXCLUDED.can_write,
                can_edit   = EXCLUDED.can_edit,
                can_delete = FALSE,
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
        ");

        foreach ($allowedTypes as $rt) {
            if (!isset($body[$rt])) continue;
            $p = $body[$rt];
            $stmt->execute([
                $userId,
                $rt,
                (int)(bool)($p['can_read'] ?? false),
                (int)(bool)($p['can_write'] ?? false),
                (int)(bool)($p['can_edit'] ?? false),
                (int)$admin['user_id'],
            ]);
        }

        ActivityLogger::log(
            (int)$admin['user_id'],
            'updated',
            'intern_permissions',
            $userId,
            null,
            ['permissions' => $body]
        );

        exit(json_encode(['success' => true]));
    }
}
