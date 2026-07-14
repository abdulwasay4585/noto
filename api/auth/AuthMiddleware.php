<?php
// api/auth/AuthMiddleware.php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware {
    private static $pdo;

    public static function setPdo($pdo): void {
        self::$pdo = $pdo;
    }

    /**
     * Resolve the current user from the Authorization Bearer token.
     * Returns user array or null if not authenticated.
     */
    public static function resolve(): ?array {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return null;
        }
        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
            return [
                'id'      => $decoded->user_id,
                'user_id' => $decoded->user_id,
                'email'   => $decoded->email,
                'role'    => $decoded->role
            ];
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Require authentication. Exits with 401 if not authenticated.
     */
    public static function require(): array {
        $user = self::resolve();
        if (!$user) {
            http_response_code(401);
            exit(json_encode(['error' => 'Unauthenticated']));
        }
        return $user;
    }

    /**
     * Require the admin role. Exits with 403 if not admin.
     */
    public static function requireAdmin(): array {
        $user = self::require();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            exit(json_encode(['error' => 'Admin access required']));
        }
        return $user;
    }
}
