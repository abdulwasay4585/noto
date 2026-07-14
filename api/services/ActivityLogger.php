<?php
// api/services/ActivityLogger.php

class ActivityLogger {
    /**
     * Log a user action to the activity_logs table.
     *
     * @param int         $userId      The user performing the action
     * @param string      $action      'created' | 'updated' | 'uploaded' | 'attempted_delete'
     * @param string      $entityType  'resource' | 'past_paper' | 'subject'
     * @param int|null    $entityId    ID of the affected entity
     * @param string|null $entityTitle Name/title snapshot at time of action
     * @param array       $metadata    Extra context: changed_fields, before/after values, etc.
     */
    public static function log(
        int $userId,
        string $action,
        string $entityType,
        ?int $entityId,
        ?string $entityTitle,
        array $metadata = []
    ): void {
        global $pdo;
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO activity_logs
                 (user_id, action, entity_type, entity_id, entity_title, metadata, ip_address)
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $userId,
                $action,
                $entityType,
                $entityId,
                $entityTitle,
                !empty($metadata) ? json_encode($metadata) : null,
                $_SERVER['REMOTE_ADDR'] ?? null,
            ]);
        } catch (Exception $e) {
            error_log('ActivityLogger::log failed: ' . $e->getMessage());
        }
    }
}
