<?php
// api/controllers/AuthController.php

require_once __DIR__ . '/../auth/AuthMiddleware.php';
use Firebase\JWT\JWT;

class AuthController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    /**
     * POST /api/auth/register
     * Register a new student user.
     */
    public function register(): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $email = trim($body['email'] ?? '');
        $password = $body['password'] ?? '';
        $first_name = trim($body['first_name'] ?? '');
        $last_name = trim($body['last_name'] ?? '');
        $phone_number = trim($body['phone_number'] ?? '');
        $terms_accepted = !empty($body['terms_accepted']) ? 'true' : 'false';

        if (!$email || !$password) {
            http_response_code(400);
            exit(json_encode(['error' => 'Email and password are required']));
        }

        // Check if email exists
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            http_response_code(400);
            exit(json_encode(['error' => 'Email is already registered']));
        }

        // Insert new user
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $stmt = $this->pdo->prepare("INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number, terms_accepted) VALUES (?, ?, 'student', ?, ?, ?, ?)");
        $stmt->execute([$email, $hash, $first_name, $last_name, $phone_number, $terms_accepted]);
        $user_id = $this->pdo->lastInsertId();

        // Generate JWT
        $payload = [
            'iss' => 'noto_api',
            'iat' => time(),
            'exp' => time() + (8 * 3600), // 8 hours
            'user_id' => $user_id,
            'role' => 'student',
            'email' => $email
        ];
        $token = JWT::encode($payload, JWT_SECRET, 'HS256');

        exit(json_encode([
            'token' => $token,
            'user'  => [
                'id'                  => $user_id,
                'email'               => $email,
                'role'                => 'student',
                'first_name'          => $first_name,
                'last_name'           => $last_name,
                'phone_number'        => $phone_number,
                'must_change_password'=> false,
                'permissions'         => [],
            ],
        ]));
    }

    /**
     * POST /api/auth/login
     * Accepts username or email + password.
     * Returns token + user object + permissions.
     */
    public function login(): void {
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $identifier = trim($body['email'] ?? $body['username'] ?? '');
        $password   = $body['password'] ?? '';

        if (!$identifier || !$password) {
            http_response_code(400);
            exit(json_encode(['error' => 'Email and password are required']));
        }

        // Login by email only (no username or is_active column in schema)
        $stmt = $this->pdo->prepare(
            "SELECT * FROM users WHERE email = ?"
        );
        $stmt->execute([$identifier]);
        $user = $stmt->fetch();

        if (!$user) {
            http_response_code(401);
            exit(json_encode(['error' => 'Account or user not found']));
        }

        if (!password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            exit(json_encode(['error' => 'Invalid credentials']));
        }

        // Generate JWT
        $payload = [
            'iss' => 'noto_api',
            'iat' => time(),
            'exp' => time() + (8 * 3600), // 8 hours
            'user_id' => $user['id'],
            'role' => $user['role'],
            'email' => $user['email']
        ];
        $token = JWT::encode($payload, JWT_SECRET, 'HS256');

        // Update last_login
        $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")
                  ->execute([$user['id']]);

        // Load permissions for interns
        $permissions = [];
        if ($user['role'] === 'intern') {
            $pStmt = $this->pdo->prepare(
                "SELECT resource_type, can_read, can_write, can_edit, can_delete
                 FROM intern_permissions WHERE user_id = ?"
            );
            $pStmt->execute([$user['id']]);
            $rows = $pStmt->fetchAll();
            foreach ($rows as $row) {
                $permissions[$row['resource_type']] = [
                    'can_read'   => (bool)$row['can_read'],
                    'can_write'  => (bool)$row['can_write'],
                    'can_edit'   => (bool)$row['can_edit'],
                    'can_delete' => false, // always false for interns
                ];
            }
        } else if ($user['role'] === 'admin') {
            // Admin has all permissions
            foreach (['resources', 'past_papers', 'subjects', 'categories'] as $rt) {
                $permissions[$rt] = [
                    'can_read'   => true,
                    'can_write'  => true,
                    'can_edit'   => true,
                    'can_delete' => true,
                ];
            }
        }

        exit(json_encode([
            'token' => $token,
            'user'  => [
                'id'                  => $user['id'],
                'email'               => $user['email'],
                'role'                => $user['role'],
                'first_name'          => $user['first_name'] ?? '',
                'last_name'           => $user['last_name'] ?? '',
                'phone_number'        => $user['phone_number'] ?? '',
                'must_change_password'=> false,
                'permissions'         => $permissions,
            ],
        ]));
    }

    /**
     * POST /api/auth/logout
     * Deletes the current session token.
     */
    public function logout(): void {
        // With JWTs, logout is stateless. The client simply deletes the token from sessionStorage.
        // If we wanted to invalidate them server-side, we would need a token blacklist in the DB,
        // but for now, we just return success.
        exit(json_encode(['success' => true]));
    }

    /**
     * GET /api/auth/me
     * Returns the currently authenticated user + permissions.
     */
    public function me(): void {
        $user = AuthMiddleware::require();
        $userId = (int)$user['user_id'];

        $permissions = [];
        if ($user['role'] === 'intern') {
            $pStmt = $this->pdo->prepare(
                "SELECT resource_type, can_read, can_write, can_edit, can_delete
                 FROM intern_permissions WHERE user_id = ?"
            );
            $pStmt->execute([$userId]);
            $rows = $pStmt->fetchAll();
            foreach ($rows as $row) {
                $permissions[$row['resource_type']] = [
                    'can_read'   => (bool)$row['can_read'],
                    'can_write'  => (bool)$row['can_write'],
                    'can_edit'   => (bool)$row['can_edit'],
                    'can_delete' => false,
                ];
            }
        } else if ($user['role'] === 'admin') {
            foreach (['resources', 'past_papers', 'subjects', 'categories'] as $rt) {
                $permissions[$rt] = ['can_read' => true, 'can_write' => true, 'can_edit' => true, 'can_delete' => true];
            }
        }

        // Get full user record (only columns that exist)
        $uStmt = $this->pdo->prepare(
            "SELECT id, email, role, first_name, last_name, phone_number, created_at
             FROM users WHERE id = ?"
        );
        $uStmt->execute([$userId]);
        $fullUser = $uStmt->fetch();

        exit(json_encode([
            'user' => [
                'id'                  => $fullUser['id'],
                'email'               => $fullUser['email'],
                'role'                => $fullUser['role'],
                'first_name'          => $fullUser['first_name'] ?? '',
                'last_name'           => $fullUser['last_name'] ?? '',
                'phone_number'        => $fullUser['phone_number'] ?? '',
                'must_change_password'=> false,
                'permissions'         => $permissions,
            ],
        ]));
    }

    /**
     * POST /api/auth/change-password
     * Force password change for must_change_password = true users.
     */
    public function changePassword(): void {
        $user = AuthMiddleware::require();
        $body = json_decode(file_get_contents('php://input'), true) ?? [];
        $currentPassword = $body['current_password'] ?? '';
        $newPassword     = $body['new_password'] ?? '';

        if (strlen($newPassword) < 8) {
            http_response_code(400);
            exit(json_encode(['error' => 'New password must be at least 8 characters']));
        }

        $stmt = $this->pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([(int)$user['user_id']]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
            http_response_code(401);
            exit(json_encode(['error' => 'Current password is incorrect']));
        }

        $newHash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->pdo->prepare(
            "UPDATE users SET password_hash = ?, must_change_password = FALSE WHERE id = ?"
        )->execute([$newHash, (int)$user['user_id']]);

        exit(json_encode(['success' => true]));
    }
}
