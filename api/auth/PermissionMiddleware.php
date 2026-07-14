<?php
// api/auth/PermissionMiddleware.php

require_once __DIR__ . '/../services/ActivityLogger.php';

class PermissionMiddleware {
    /**
     * Check if the given user can perform $action on $resourceType.
     * Admins bypass all checks. Interns can never delete (hard rule, server-enforced).
     */
    public static function check(array $user, string $resourceType, string $action): void {
        // Admins bypass all permission checks
        if ($user['role'] === 'admin') return;

        // HARD RULE: interns can never delete, regardless of any DB permission record
        if ($action === 'delete') {
            ActivityLogger::log(
                (int)$user['user_id'],
                'attempted_delete',
                $resourceType,
                null,
                null,
                []
            );
            http_response_code(403);
            exit(json_encode(['error' => 'Interns cannot delete records']));
        }

        $columnMap = [
            'read'  => 'can_read',
            'write' => 'can_write',
            'edit'  => 'can_edit',
        ];

        $col = $columnMap[$action] ?? null;
        if (!$col) {
            http_response_code(400);
            exit(json_encode(['error' => 'Unknown action']));
        }

        global $pdo;
        $stmt = $pdo->prepare(
            "SELECT $col FROM intern_permissions
             WHERE user_id = ? AND resource_type = ?"
        );
        $stmt->execute([(int)$user['user_id'], $resourceType]);
        $perm = $stmt->fetch();

        if (!$perm || !$perm[$col]) {
            http_response_code(403);
            exit(json_encode(['error' => "Permission denied: cannot $action $resourceType"]));
        }
    }
}
