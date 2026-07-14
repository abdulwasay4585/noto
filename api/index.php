<?php
// api/index.php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/services/TaggingService.php';
require_once __DIR__ . '/services/ActivityLogger.php';
require_once __DIR__ . '/auth/AuthMiddleware.php';
require_once __DIR__ . '/auth/PermissionMiddleware.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/PermissionController.php';
require_once __DIR__ . '/controllers/ActivityLogController.php';

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/vendor/autoload.php';

header('Content-Type: application/json');
// Allow CORS
header("Access-Control-Allow-Origin: *");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$requestUri = $_SERVER['REQUEST_URI'];
// Remove query string
$path = parse_url($requestUri, PHP_URL_PATH);
// Base path should be /api/
$path = str_replace('/api/', '', $path);
$pathParts = explode('/', trim($path, '/'));
$method = $_SERVER['REQUEST_METHOD'];

function getBody() {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function sendError($msg, $status = 400) {
    sendJson(['error' => $msg], $status);
}

function requireAuth($allowedRoles = []) {
    global $pdo;
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        sendError('Unauthorized', 401);
    }
    $token = $matches[1];
    
    try {
        // Try decoding as JWT first
        $decoded = \Firebase\JWT\JWT::decode($token, new \Firebase\JWT\Key(JWT_SECRET, 'HS256'));
        $user = [
            'id' => $decoded->user_id,
            'user_id' => $decoded->user_id,
            'email' => $decoded->email,
            'role' => $decoded->role
        ];
        if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles)) {
            sendError('Forbidden', 403);
        }
        return $user;
    } catch (Exception $e) {
        // Fallback to legacy sessions table
        $stmt = $pdo->prepare("
            SELECT u.* FROM users u 
            JOIN sessions s ON u.id = s.user_id 
            WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
        ");
        $stmt->execute([$token]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Unauthorized or session expired', 401);
        }
        
        if (!empty($allowedRoles) && !in_array($user['role'], $allowedRoles)) {
            sendError('Forbidden', 403);
        }
        
        return $user;
    }
}

/** Like requireAuth but returns null instead of exiting when not authenticated */
function getAuthUser() {
    global $pdo;
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        return null;
    }
    $token = $matches[1];
    $stmt = $pdo->prepare("
        SELECT u.* FROM users u 
        JOIN sessions s ON u.id = s.user_id 
        WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
    ");
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}

try {
    if ($path === 'health' && $method === 'GET') {
        sendJson(['status' => 'ok', 'timestamp' => date('c')]);
    }

    // Legacy auth routes removed; now handled by AuthController at the bottom of the file.

    if ($path === 'categories' && $method === 'GET') {
        $stmt = $pdo->query('SELECT * FROM categories ORDER BY id ASC');
        sendJson($stmt->fetchAll());
    }

    if ($path === 'subjects' && $method === 'GET') {
        $categoryId = $_GET['categoryId'] ?? null;
        if ($categoryId) {
            $stmt = $pdo->prepare('SELECT * FROM subjects WHERE category_id = ? ORDER BY name ASC');
            $stmt->execute([$categoryId]);
        } else {
            $stmt = $pdo->query('SELECT * FROM subjects ORDER BY name ASC');
        }
        sendJson($stmt->fetchAll());
    }

    if ($path === 'resources' && $method === 'GET') {
        $categoryId = $_GET['categoryId'] ?? null;
        $subjectId = $_GET['subjectId'] ?? null;
        $type = $_GET['type'] ?? null;
        $search = $_GET['search'] ?? null;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        $query = "SELECT r.*, c.name as category_name, s.name as subject_name 
                  FROM resources r
                  JOIN categories c ON r.category_id = c.id
                  JOIN subjects s ON r.subject_id = s.id
                  WHERE 1=1";
        $params = [];

        if ($categoryId) {
            $query .= " AND r.category_id = ?";
            $params[] = $categoryId;
        }
        if ($subjectId) {
            $query .= " AND r.subject_id = ?";
            $params[] = $subjectId;
        }
        if ($type) {
            $query .= " AND r.type = ?";
            $params[] = $type;
        }
        if ($search) {
            $query .= " AND (r.title ILIKE ? OR r.description ILIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }

        $countQuery = str_replace("SELECT r.*, c.name as category_name, s.name as subject_name", "SELECT COUNT(*) as total", $query);
        $countStmt = $pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $query .= " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        $resources = $stmt->fetchAll();

        sendJson([
            'data' => $resources,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'totalPages' => ceil($total / $limit)
            ]
        ]);
    }

    if ($pathParts[0] === 'resources' && isset($pathParts[1])) {
        $id = $pathParts[1];

        // Skip if it's a named sub-route (not a numeric ID)
        if (!is_numeric($id)) {
            // Let other handlers below deal with it (e.g. resources/submit)
            goto after_resources_id;
        }

        if ($method === 'GET') {
            if (isset($pathParts[2]) && $pathParts[2] === 'summary') {
                sendError('GET summary not supported');
            }
            $stmt = $pdo->prepare("
              SELECT r.*, c.name as category_name, s.name as subject_name 
              FROM resources r
              JOIN categories c ON r.category_id = c.id
              JOIN subjects s ON r.subject_id = s.id
              WHERE r.id = ?
            ");
            $stmt->execute([$id]);
            $resource = $stmt->fetch();
            if (!$resource) sendError('Resource not found', 404);

            $stmtTags = $pdo->prepare("
              SELECT t.* FROM tags t
              JOIN resource_tags rt ON t.id = rt.tag_id
              WHERE rt.resource_id = ?
            ");
            $stmtTags->execute([$id]);
            $resource['tags'] = $stmtTags->fetchAll();
            sendJson($resource);
        }

        if ($method === 'PUT') {
            $user = AuthMiddleware::require();
            PermissionMiddleware::check($user, 'resources', 'edit');
            $data = getBody();

            // Snapshot before for activity log
            $oldStmt = $pdo->prepare('SELECT title, google_drive_url FROM resources WHERE id = ?');
            $oldStmt->execute([$id]);
            $old = $oldStmt->fetch();

            $stmt = $pdo->prepare("
                UPDATE resources 
                SET title = ?, description = ?, type = ?, google_drive_url = ?,
                    thumbnail = ?, category_id = ?, subject_id = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $data['type'],
                $data['google_drive_url'],
                $data['thumbnail'] ?? null,
                $data['category_id'],
                $data['subject_id'],
                $id
            ]);

            ActivityLogger::log(
                (int)$user['user_id'], 'updated', 'resource', (int)$id, $data['title'],
                ['changed_fields' => ['title','google_drive_url'], 'before' => $old, 'after' => ['title' => $data['title'], 'google_drive_url' => $data['google_drive_url']]]
            );
            sendJson(['success' => true]);
        }

        if ($method === 'DELETE') {
            // Hard check: interns can never delete (PermissionMiddleware will exit for interns)
            $user = AuthMiddleware::require();
            PermissionMiddleware::check($user, 'resources', 'delete');
            $stmt = $pdo->prepare('DELETE FROM resources WHERE id = ?');
            $stmt->execute([$id]);
            sendJson(['success' => true]);
        }
    }
    after_resources_id:


    if ($path === 'resources' && $method === 'POST') {
        $user = AuthMiddleware::require();
        PermissionMiddleware::check($user, 'resources', 'write');
        $data = getBody();
        $stmt = $pdo->prepare("
            INSERT INTO resources (title, description, type, google_drive_url, thumbnail, category_id, subject_id)
            VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
        ");
        $stmt->execute([
            $data['title'],
            $data['description'] ?? null,
            $data['type'],
            $data['google_drive_url'],
            $data['thumbnail'] ?? null,
            $data['category_id'],
            $data['subject_id']
        ]);
        $newId = $stmt->fetchColumn();

        ActivityLogger::log(
            (int)$user['user_id'], 'created', 'resource', (int)$newId, $data['title'],
            ['type' => $data['type'], 'google_drive_url' => $data['google_drive_url']]
        );
        
        // Auto-tag on creation if Gemini is configured (best effort)
        try {
            $tagger = new TaggingService($pdo);
            $tagger->tagResource($newId);
        } catch (Exception $e) {
            error_log("Failed to auto-tag resource $newId: " . $e->getMessage());
        }
        
        sendJson(['id' => $newId]);
    }

    if ($pathParts[0] === 'resources' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'tag' && $method === 'POST') {
        requireAuth(['admin']);
        $id = $pathParts[1];
        $tagger = new TaggingService($pdo);
        $result = $tagger->tagResource($id);
        sendJson($result);
    }

    if ($pathParts[0] === 'resources' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'generate-summary' && $method === 'POST') {
        requireAuth(['admin', 'intern']);
        $id = $pathParts[1];
        
        $stmt = $pdo->prepare("
            SELECT r.title, r.description, r.type, c.name as category_name, s.name as subject_name, r.google_drive_url 
            FROM resources r
            JOIN categories c ON r.category_id = c.id
            JOIN subjects s ON r.subject_id = s.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $resource = $stmt->fetch();
        if (!$resource) sendError('Resource not found', 404);

        $apiKey = getenv('GEMINI_API_KEY');
        if (!$apiKey) sendError('Gemini API key not configured on server', 500);

        $prompt = "Summarize the following academic resource in a formal, structured, and highly professional manner for an elite student. Focus on key learning outcomes and precise coverage. Keep the summary concise, strictly under 150 words.\n\n" .
                  "Title: " . $resource['title'] . "\n" .
                  "Description: " . $resource['description'] . "\n" .
                  "Type: " . $resource['type'] . "\n" .
                  "Category: " . $resource['category_name'] . "\n" .
                  "Subject: " . $resource['subject_name'];

        $fileId = null;
        if (preg_match('/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|uc\?.*?id=|[?&]id=)([a-zA-Z0-9_-]+)/', $resource['google_drive_url'], $matches)) {
            $fileId = $matches[1];
        }

        $parts = [["text" => $prompt]];

        if ($fileId) {
            $downloadUrl = "https://drive.google.com/uc?export=download&id=" . $fileId;
            $fileData = @file_get_contents($downloadUrl);
            if ($fileData) {
                // If it's HTML (like a virus scan warning or Google Doc), Gemini might still be able to parse text, but let's assume it's a PDF for general cases, or generic bytes.
                $finfo = new finfo(FILEINFO_MIME_TYPE);
                $mime = $finfo->buffer($fileData) ?: 'application/pdf';
                // If it's an HTML page from GDrive, it might just be the preview page. We'll pass it anyway.
                $parts[] = [
                    "inlineData" => [
                        "mimeType" => $mime,
                        "data" => base64_encode($fileData)
                    ]
                ];
            }
        }

        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            "contents" => [["parts" => $parts]]
        ]));
        $response = curl_exec($ch);
        curl_close($ch);
        
        $json = json_decode($response, true);
        $summary = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
        
        if ($summary) {
            $stmt = $pdo->prepare('UPDATE resources SET ai_summary = ? WHERE id = ?');
            $stmt->execute([$summary, $id]);

            // Auto-generate flashcards after summary
            try {
                $flashPrompt = "Based on this academic summary, generate exactly 6 flashcard question-and-answer pairs. Return ONLY a JSON array: [{\"front\":\"Q?\",\"back\":\"A\",\"topic\":\"Topic\"}]\n\n" . $summary;
                $fch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey);
                curl_setopt($fch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($fch, CURLOPT_POST, true);
                curl_setopt($fch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
                curl_setopt($fch, CURLOPT_POSTFIELDS, json_encode([
                    "contents" => [["parts" => [["text" => $flashPrompt]]]]
                ]));
                $fResponse = curl_exec($fch);
                curl_close($fch);
                $fJson = json_decode($fResponse, true);
                $fText = $fJson['candidates'][0]['content']['parts'][0]['text'] ?? '[]';
                $fText = preg_replace('/```json\s*/i', '', $fText);
                $fText = preg_replace('/```\s*/i', '', $fText);
                $flashcards = json_decode(trim($fText), true);
                if (is_array($flashcards)) {
                    // Delete old flashcards for this resource first
                    $pdo->prepare('DELETE FROM flashcards WHERE resource_id = ?')->execute([$id]);
                    $fStmt = $pdo->prepare('INSERT INTO flashcards (resource_id, front, back, topic) VALUES (?, ?, ?, ?)');
                    foreach ($flashcards as $card) {
                        if (!empty($card['front']) && !empty($card['back'])) {
                            $fStmt->execute([$id, $card['front'], $card['back'], $card['topic'] ?? null]);
                        }
                    }
                }
            } catch (Exception $e) {
                error_log("Failed to generate flashcards for resource $id: " . $e->getMessage());
            }

            sendJson(['success' => true, 'summary' => $summary]);
        } else {
            sendError('Failed to generate summary from AI', 500);
        }
    }

    // ─── Section 1: RAG Chat ─────────────────────────────────────────────────

    if ($path === 'chat/sessions' && $method === 'POST') {
        $user = getAuthUser();
        $userId = $user ? $user['id'] : null;
        $sessionId = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("INSERT INTO chat_sessions (user_id, user_session_id) VALUES (?, ?) RETURNING id");
        $stmt->execute([$userId, $sessionId]);
        sendJson(['id' => $stmt->fetchColumn(), 'session_id' => $sessionId]);
    }

    if ($path === 'chat/upload' && $method === 'POST') {
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            sendError('No file uploaded or upload error');
        }
        $file = $_FILES['file'];
        
        // Ensure finfo is used securely
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        if (!$mime) $mime = $file['type'];

        $apiKey = getenv('GEMINI_API_KEY');
        if (!$apiKey) sendError('Gemini API key not configured', 500);
        
        $uploadUrl = "https://generativelanguage.googleapis.com/upload/v1beta/files?key=" . $apiKey;

        $ch = curl_init($uploadUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        
        $fileSize = filesize($file['tmp_name']);
        
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "X-Goog-Upload-Protocol: raw",
            "X-Goog-Upload-Command: upload, finalize",
            "Content-Length: " . $fileSize,
            "X-Goog-Upload-Header-Content-Length: " . $fileSize,
            "X-Goog-Upload-Header-Content-Type: " . $mime,
            "Content-Type: " . $mime
        ]);
        
        $fp = fopen($file['tmp_name'], 'r');
        curl_setopt($ch, CURLOPT_INFILE, $fp);
        curl_setopt($ch, CURLOPT_INFILESIZE, $fileSize);
        
        $response = curl_exec($ch);
        curl_close($ch);
        fclose($fp);

        $json = json_decode($response, true);
        if (!$json || !isset($json['file']['uri'])) {
            sendError('Failed to upload file to Gemini');
        }

        sendJson([
            'file_uri' => $json['file']['uri'],
            'mime_type' => $json['file']['mimeType']
        ]);
    }

    if ($pathParts[0] === 'chat' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'message' && $method === 'POST') {
        $chatSessionId = $pathParts[1];
        $data = getBody();
        $content = trim($data['content'] ?? '');
        $fileUri = $data['attached_file_uri'] ?? null;
        $fileMime = $data['attached_file_mime'] ?? null;
        
        if (empty($content) && empty($fileUri)) sendError('Message content or file required');

        $stmt = $pdo->prepare("INSERT INTO chat_messages (session_id, role, content, attached_file_uri, attached_file_mime) VALUES (?, 'user', ?, ?, ?)");
        $stmt->execute([$chatSessionId, $content, $fileUri, $fileMime]);

        $apiKey = getenv('GEMINI_API_KEY');
        if (!$apiKey) sendError('Gemini API key not configured', 500);

        // RAG: embed question and find similar resources
        $embedCh = curl_init("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=" . $apiKey);
        curl_setopt($embedCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($embedCh, CURLOPT_POST, true);
        curl_setopt($embedCh, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($embedCh, CURLOPT_POSTFIELDS, json_encode([
            "model" => "models/text-embedding-004",
            "content" => ["parts" => [["text" => $content]]]
        ]));
        $embedResponse = curl_exec($embedCh);
        curl_close($embedCh);
        $embedJson = json_decode($embedResponse, true);
        $queryVector = $embedJson['embedding']['values'] ?? null;

        $citedIds = [];
        $contextText = "";
        if ($queryVector) {
            $vectorString = '[' . implode(',', $queryVector) . ']';
            $simStmt = $pdo->prepare("
                SELECT id, title, ai_summary
                FROM resources
                WHERE embedding IS NOT NULL AND ai_summary IS NOT NULL
                ORDER BY embedding <=> ?
                LIMIT 4
            ");
            $simStmt->execute([$vectorString]);
            foreach ($simStmt->fetchAll() as $r) {
                $contextText .= "\n\n[Resource: " . $r['title'] . "]\n" . substr($r['ai_summary'], 0, 800);
                $citedIds[] = $r['id'];
            }
        }

        $fullPrompt = "You are NOTO, an AI study assistant. Answer the student's question helpfully. Use the provided academic resources if they are relevant to the question. If the student greets you or asks a general question, feel free to respond conversationally without strictly relying on the resources.\n\nResources:" . $contextText . "\n\nStudent Question: " . $content;

        // Build parts array
        $parts = [["text" => $fullPrompt]];
        if ($fileUri && $fileMime) {
            $parts[] = [
                "fileData" => [
                    "mimeType" => $fileMime,
                    "fileUri" => $fileUri
                ]
            ];
        }

        $chatCh = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey);
        curl_setopt($chatCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chatCh, CURLOPT_POST, true);
        curl_setopt($chatCh, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($chatCh, CURLOPT_POSTFIELDS, json_encode([
            "contents" => [["parts" => $parts]]
        ]));
        $chatResponse = curl_exec($chatCh);
        curl_close($chatCh);
        $chatJson = json_decode($chatResponse, true);
        if (!$chatJson || !isset($chatJson['candidates'])) {
            sendJson(['error' => 'Gemini API Error', 'raw_response' => $chatJson ?? $chatResponse]);
        }
        $assistantText = $chatJson['candidates'][0]['content']['parts'][0]['text'] ?? 'Sorry, I could not generate a response.';


        $pgCited = '{' . implode(',', $citedIds) . '}';
        $aStmt = $pdo->prepare("INSERT INTO chat_messages (session_id, role, content, cited_resource_ids) VALUES (?, 'assistant', ?, ?) RETURNING id, created_at");
        $aStmt->execute([$chatSessionId, $assistantText, $pgCited]);
        $aMsg = $aStmt->fetch();

        sendJson([
            'id' => $aMsg['id'], 'role' => 'assistant', 'content' => $assistantText,
            'cited_resource_ids' => $citedIds, 'created_at' => $aMsg['created_at'],
        ]);
    }

    if ($pathParts[0] === 'chat' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'history' && $method === 'GET') {
        $chatSessionId = $pathParts[1];
        $stmt = $pdo->prepare("SELECT id, role, content, attached_file_uri, attached_file_mime, cited_resource_ids, created_at FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC");
        $stmt->execute([$chatSessionId]);
        $messages = $stmt->fetchAll();
        foreach ($messages as &$msg) {
            $inner = trim($msg['cited_resource_ids'] ?? '{}', '{}');
            $msg['cited_resource_ids'] = $inner ? array_map('intval', explode(',', $inner)) : [];
        }
        sendJson(['data' => $messages]);
    }

    // ─── Section 2: Past Papers ───────────────────────────────────────────────

    if ($path === 'past-papers' && $method === 'GET') {
        $q = "SELECT pp.*, s.name as subject_name FROM past_papers pp JOIN subjects s ON s.id = pp.subject_id WHERE 1=1";
        $params = [];
        if (!empty($_GET['subjectId'])) { $q .= " AND pp.subject_id = ?"; $params[] = $_GET['subjectId']; }
        if (!empty($_GET['yearFrom']))  { $q .= " AND pp.year >= ?";     $params[] = $_GET['yearFrom']; }
        if (!empty($_GET['yearTo']))    { $q .= " AND pp.year <= ?";     $params[] = $_GET['yearTo']; }
        $q .= " ORDER BY pp.year DESC, pp.session ASC";
        $stmt = $pdo->prepare($q);
        $stmt->execute($params);
        sendJson(['data' => $stmt->fetchAll()]);
    }

    if ($path === 'past-papers' && $method === 'POST') {
        requireAuth(['admin']);
        $data = getBody();
        $stmt = $pdo->prepare("INSERT INTO past_papers (subject_id, year, session, paper_number, question_paper_url, mark_scheme_url) VALUES (?, ?, ?, ?, ?, ?) RETURNING id");
        $stmt->execute([$data['subject_id'], $data['year'], $data['session'] ?? null, $data['paper_number'] ?? 1, $data['question_paper_url'] ?? null, $data['mark_scheme_url'] ?? null]);
        sendJson(['id' => $stmt->fetchColumn(), 'success' => true]);
    }

    // ─── Section 3: Topic Frequency ──────────────────────────────────────────

    if ($pathParts[0] === 'topics' && isset($pathParts[1]) && isset($pathParts[2]) && $method === 'GET') {
        $subjectId = $pathParts[2];
        if ($pathParts[1] === 'frequency') {
            $stmt = $pdo->prepare("SELECT unnest(pq.topic_tags) AS topic, COUNT(*) AS occurrence_count FROM paper_questions pq JOIN past_papers pp ON pp.id = pq.paper_id WHERE pp.subject_id = ? GROUP BY topic ORDER BY occurrence_count DESC LIMIT 20");
            $stmt->execute([$subjectId]);
            sendJson(['data' => $stmt->fetchAll()]);
        }
        if ($pathParts[1] === 'predictions') {
            $stmt = $pdo->prepare("SELECT unnest(pq.topic_tags) AS topic, COUNT(*) AS freq, MAX(pp.year) AS last_year FROM paper_questions pq JOIN past_papers pp ON pp.id = pq.paper_id WHERE pp.subject_id = ? GROUP BY topic ORDER BY freq DESC, last_year ASC LIMIT 10");
            $stmt->execute([$subjectId]);
            sendJson(['data' => $stmt->fetchAll()]);
        }
    }

    // ─── Section 4: Study Plans ───────────────────────────────────────────────

    if ($path === 'study-plans' && $method === 'POST') {
        require_once __DIR__ . '/services/RoadmapGenerator.php';
        $data = getBody();
        $sessionId = $data['session_id'] ?? bin2hex(random_bytes(8));
        $user = getAuthUser();
        $userId = $user ? $user['id'] : null;

        $subjectsPg = '{' . implode(',', array_map('intval', $data['subjects'] ?? [])) . '}';
        $stmt = $pdo->prepare("INSERT INTO study_plans (user_id, user_session_id, exam_date, subjects, hours_per_week) VALUES (?, ?, ?, ?, ?) RETURNING id");
        $stmt->execute([$userId, $sessionId, $data['exam_date'], $subjectsPg, $data['hours_per_week']]);
        $planId = $stmt->fetchColumn();

        $plan = ['id' => $planId, 'exam_date' => $data['exam_date'], 'subjects' => $data['subjects'] ?? [], 'hours_per_week' => $data['hours_per_week']];
        $generator = new RoadmapGenerator($pdo);
        $tasks = $generator->generate($plan);

        $tStmt = $pdo->prepare("INSERT INTO study_plan_tasks (plan_id, scheduled_date, subject_id, topic, resource_ids, estimated_minutes, status, is_weak_topic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($tasks as $task) {
            $tStmt->execute([$task['plan_id'], $task['scheduled_date'], $task['subject_id'], $task['topic'], $task['resource_ids'], $task['estimated_minutes'], $task['status'], $task['is_weak_topic'] ? 'true' : 'false']);
        }
        sendJson(['id' => $planId, 'success' => true]);
    }

    if ($pathParts[0] === 'study-plans' && isset($pathParts[1]) && !isset($pathParts[2]) && $method === 'GET') {
        $planId = $pathParts[1];
        $stmt = $pdo->prepare("SELECT * FROM study_plans WHERE id = ?");
        $stmt->execute([$planId]);
        $plan = $stmt->fetch();
        if (!$plan) sendError('Plan not found', 404);
        $tStmt = $pdo->prepare("SELECT spt.*, s.name as subject_name FROM study_plan_tasks spt LEFT JOIN subjects s ON s.id = spt.subject_id WHERE spt.plan_id = ? ORDER BY spt.scheduled_date ASC");
        $tStmt->execute([$planId]);
        $plan['tasks'] = $tStmt->fetchAll();
        sendJson($plan);
    }

    if ($pathParts[0] === 'study-plans' && isset($pathParts[3]) && $pathParts[2] === 'tasks' && $method === 'PATCH') {
        $data = getBody();
        $stmt = $pdo->prepare("UPDATE study_plan_tasks SET status = ? WHERE id = ? AND plan_id = ?");
        $stmt->execute([$data['status'] ?? 'pending', $pathParts[3], $pathParts[1]]);
        sendJson(['success' => true]);
    }

    // ─── Section 5: Mock Exams + Readiness ───────────────────────────────────

    if ($path === 'mock-exams/generate' && $method === 'POST') {
        $data = getBody();
        $subjectId = $data['subjectId'] ?? null;
        $topics = $data['topics'] ?? [];
        if (!$subjectId) sendError('subjectId required');

        $stmt = $pdo->prepare("SELECT name FROM subjects WHERE id = ?");
        $stmt->execute([$subjectId]);
        $subjectName = $stmt->fetchColumn();
        if (!$subjectName) sendError('Subject not found');

        $apiKey = getenv('GEMINI_API_KEY');
        if (!$apiKey && file_exists(__DIR__ . '/../.env')) {
            $env = parse_ini_file(__DIR__ . '/../.env');
            $apiKey = $env['GEMINI_API_KEY'] ?? null;
        }
        if (!$apiKey) sendError('Gemini API key not configured on server', 500);

        $topicsStr = !empty($topics) ? " Focus SPECIFICALLY on the following topics: " . implode(', ', $topics) . "." : "";

        $prompt = "Generate a mock exam for the subject '$subjectName' based on standard CAIE, IGCSE, O-Level, A-Level, or SAT syllabus topics." . $topicsStr . "\n" .
                  "Create exactly 3 challenging questions. You can use Markdown and Mermaid diagrams in the question text if appropriate.\n" .
                  "Return the response STRICTLY as a JSON array where each object has:\n" .
                  "- 'text': The markdown formatted question text (can include mermaid blocks).\n" .
                  "- 'marks': An integer representing the marks for this question (e.g., 5 or 10).\n" .
                  "- 'topic': A short string representing the topic tag.\n" .
                  "DO NOT return any markdown formatting outside the JSON array, just the raw JSON.";

        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            "contents" => [["parts" => [["text" => $prompt]]]]
        ]));
        $response = curl_exec($ch);
        curl_close($ch);

        $json = json_decode($response, true);
        $responseText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (!$responseText) sendError('Failed to generate mock exam from AI', 500);
        
        $start = strpos($responseText, '[');
        $end = strrpos($responseText, ']');
        if ($start !== false && $end !== false) {
            $jsonStr = substr($responseText, $start, $end - $start + 1);
            $questions = json_decode($jsonStr, true);
        } else {
            $questions = json_decode(trim($responseText), true);
        }

        if (!$questions || !is_array($questions)) sendError('Invalid JSON response from AI', 500);

        $qIds = [];
        $totalMarks = 0;
        foreach ($questions as $idx => $q) {
            $marks = (int)($q['marks'] ?? 5);
            $totalMarks += $marks;
            $stmt = $pdo->prepare("INSERT INTO paper_questions (question_number, topic_tags, marks, extracted_text) VALUES (?, ?, ?, ?) RETURNING id");
            $topic = $q['topic'] ?? 'General';
            $stmt->execute([$idx + 1, '{' . $topic . '}', $marks, $q['text'] ?? '']);
            $qIds[] = $stmt->fetchColumn();
        }
        
        $qPg = '{' . implode(',', $qIds) . '}';
        $stmt = $pdo->prepare("INSERT INTO mock_exams (subject_id, question_ids, total_marks, duration_minutes) VALUES (?, ?, ?, ?) RETURNING id");
        $stmt->execute([$subjectId, $qPg, $totalMarks, 60]);
        $examId = $stmt->fetchColumn();

        $phs = implode(',', array_fill(0, count($qIds), '?'));
        $qStmt = $pdo->prepare("SELECT id, extracted_text as text, marks, topic_tags FROM paper_questions WHERE id IN ($phs)");
        $qStmt->execute($qIds);
        sendJson(['id' => $examId, 'subject_name' => $subjectName, 'total_marks' => $totalMarks, 'questions' => $qStmt->fetchAll()]);
    }

    if ($pathParts[0] === 'mock-exams' && isset($pathParts[2]) && $pathParts[2] === 'submit' && $method === 'POST') {
        $data = getBody();
        $stmt = $pdo->prepare("INSERT INTO quiz_results (user_session_id, mock_exam_id, topic, score_pct) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['session_id'] ?? 'anon', $pathParts[1], $data['topic'] ?? null, $data['score_pct'] ?? 0]);
        sendJson(['success' => true, 'score_pct' => $data['score_pct'] ?? 0]);
    }

    if ($pathParts[0] === 'mock-exams' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'solve' && $method === 'POST') {
        $examId = $pathParts[1];
        $data = getBody();
        $answers = $data['answers'] ?? [];

        $stmt = $pdo->prepare("SELECT question_ids FROM mock_exams WHERE id = ?");
        $stmt->execute([$examId]);
        $qIdsPg = $stmt->fetchColumn();
        if (!$qIdsPg) sendError('Exam not found');

        $qIds = explode(',', trim($qIdsPg, '{}'));
        $phs = implode(',', array_fill(0, count($qIds), '?'));
        $qStmt = $pdo->prepare("SELECT id, extracted_text, marks FROM paper_questions WHERE id IN ($phs)");
        $qStmt->execute($qIds);
        $questions = $qStmt->fetchAll();

        $prompt = "You are an expert AI examiner. You are grading a mock exam.\n";
        $prompt .= "Here are the questions and the student's answers:\n\n";

        foreach ($questions as $q) {
            $qId = $q['id'];
            $ans = $answers[$qId] ?? 'No answer provided';
            $prompt .= "--- Question ID $qId ({$q['marks']} marks) ---\n";
            $prompt .= "Question: " . $q['extracted_text'] . "\n";
            $prompt .= "Student Answer: " . $ans . "\n\n";
        }

        $prompt .= "Please provide a detailed step-by-step solution for each question. Also, evaluate the student's answer and give a score out of the maximum marks.\n";
        $prompt .= "Use Markdown formatting (and Mermaid diagrams if helpful) to explain your reasoning clearly.\n";
        $prompt .= "Return your response STRICTLY as a JSON object in this format:\n";
        $prompt .= "{\n";
        $prompt .= "  \"solutions\": {\n";
        $prompt .= "    \"<Question ID>\": {\n";
        $prompt .= "      \"explanation\": \"<markdown text with solution and feedback>\",\n";
        $prompt .= "      \"score\": <integer score given>\n";
        $prompt .= "    }\n";
        $prompt .= "  },\n";
        $prompt .= "  \"overall_feedback\": \"<markdown overall feedback>\"\n";
        $prompt .= "}\n";
        $prompt .= "DO NOT output any markdown outside the JSON structure.";

        $apiKey = getenv('GEMINI_API_KEY');
        if (!$apiKey && file_exists(__DIR__ . '/../.env')) {
            $env = parse_ini_file(__DIR__ . '/../.env');
            $apiKey = $env['GEMINI_API_KEY'] ?? null;
        }
        $ch = curl_init("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" . $apiKey);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            "contents" => [["parts" => [["text" => $prompt]]]]
        ]));
        $response = curl_exec($ch);
        curl_close($ch);

        $json = json_decode($response, true);
        $responseText = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (!$responseText) sendError('Failed to generate solutions from AI', 500);

        $responseText = preg_replace('/^```(?:json)?\s*/i', '', $responseText);
        $responseText = preg_replace('/\s*```$/', '', $responseText);
        $result = json_decode(trim($responseText), true);

        if (!$result || !isset($result['solutions'])) sendError('Invalid JSON response from AI', 500);

        $totalScore = 0;
        $maxMarks = 0;
        foreach ($questions as $q) {
            $maxMarks += $q['marks'];
            $totalScore += $result['solutions'][$q['id']]['score'] ?? 0;
        }
        $scorePct = $maxMarks > 0 ? ($totalScore / $maxMarks) * 100 : 0;
        $result['score_pct'] = $scorePct;

        $stmt = $pdo->prepare("INSERT INTO quiz_results (user_session_id, mock_exam_id, score_pct) VALUES (?, ?, ?)");
        $stmt->execute([$data['session_id'] ?? 'anon', $examId, $scorePct]);

        sendJson($result);
    }

    if ($pathParts[0] === 'readiness' && isset($pathParts[1]) && $method === 'GET') {
        $stmt = $pdo->prepare("SELECT topic, AVG(score_pct) as avg_score, COUNT(*) as attempts, MAX(completed_at) as last_attempt FROM quiz_results WHERE user_session_id = ? GROUP BY topic ORDER BY avg_score ASC");
        $stmt->execute([$pathParts[1]]);
        sendJson(['data' => $stmt->fetchAll()]);
    }

    // ─── Section 6: Flashcards ────────────────────────────────────────────────

    if ($pathParts[0] === 'flashcards' && $pathParts[1] === 'due' && isset($pathParts[2]) && $method === 'GET') {
        $sessionId = $pathParts[2];
        $stmt = $pdo->prepare("
            SELECT f.id, f.front, f.back, f.topic, f.resource_id,
                   COALESCE(fr.ease_factor, 2.5) as ease_factor,
                   COALESCE(fr.interval_days, 1) as interval_days,
                   COALESCE(fr.next_review_date::text, CURRENT_DATE::text) as next_review_date
            FROM flashcards f
            LEFT JOIN flashcard_reviews fr ON fr.flashcard_id = f.id AND fr.user_session_id = ?
            WHERE COALESCE(fr.next_review_date, CURRENT_DATE) <= CURRENT_DATE
            ORDER BY COALESCE(fr.next_review_date, CURRENT_DATE) ASC
            LIMIT 20
        ");
        $stmt->execute([$sessionId]);
        sendJson($stmt->fetchAll());
    }

    if ($pathParts[0] === 'flashcards' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'review' && $method === 'POST') {
        require_once __DIR__ . '/services/SpacedRepetition.php';
        $flashcardId = $pathParts[1];
        $data = getBody();
        $quality = (int) ($data['quality'] ?? 3);
        $sessionId = $data['session_id'] ?? 'anonymous';

        $stmt = $pdo->prepare("SELECT ease_factor, interval_days FROM flashcard_reviews WHERE flashcard_id = ? AND user_session_id = ?");
        $stmt->execute([$flashcardId, $sessionId]);
        $review = $stmt->fetch();
        $next = SpacedRepetition::calculate(
            $review ? (float) $review['ease_factor'] : 2.5,
            $review ? (int)   $review['interval_days'] : 1,
            $quality
        );
        $upsert = $pdo->prepare("INSERT INTO flashcard_reviews (flashcard_id, user_session_id, ease_factor, interval_days, next_review_date) VALUES (?, ?, ?, ?, ?) ON CONFLICT (flashcard_id, user_session_id) DO UPDATE SET ease_factor=EXCLUDED.ease_factor, interval_days=EXCLUDED.interval_days, next_review_date=EXCLUDED.next_review_date");
        $upsert->execute([$flashcardId, $sessionId, $next['ease_factor'], $next['interval_days'], $next['next_review_date']]);
        sendJson(['success' => true, 'next_review' => $next]);
    }

    // ─── Section 8: Crowdsourced Submissions ─────────────────────────────────

    if ($path === 'resources/submit' && $method === 'POST') {
        $data = getBody();
        $stmt = $pdo->prepare("INSERT INTO resources (title, description, type, google_drive_url, thumbnail, category_id, subject_id, submission_status, submitted_by_session) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?) RETURNING id");
        $stmt->execute([$data['title'], $data['description'] ?? null, $data['type'], $data['google_drive_url'], $data['thumbnail'] ?? null, $data['category_id'], $data['subject_id'], $data['session_id'] ?? 'anon']);
        sendJson(['id' => $stmt->fetchColumn(), 'success' => true, 'status' => 'pending']);
    }

    // ─── Section 9: Study Groups ──────────────────────────────────────────────

    if ($path === 'groups' && $method === 'POST') {
        $data = getBody();
        $name = trim($data['name'] ?? '');
        if (empty($name)) sendError('Group name required');
        $sessionId = $data['session_id'] ?? 'anon';
        do {
            $code = strtoupper(bin2hex(random_bytes(4)));
            $check = $pdo->prepare("SELECT id FROM study_groups WHERE invite_code = ?");
            $check->execute([$code]);
        } while ($check->fetch());
        $stmt = $pdo->prepare("INSERT INTO study_groups (name, invite_code, created_by_session) VALUES (?, ?, ?) RETURNING id");
        $stmt->execute([$name, $code, $sessionId]);
        $groupId = $stmt->fetchColumn();
        $pdo->prepare("INSERT INTO study_group_members (group_id, user_session_id) VALUES (?, ?) ON CONFLICT DO NOTHING")->execute([$groupId, $sessionId]);
        sendJson(['id' => $groupId, 'invite_code' => $code, 'success' => true]);
    }

    if ($pathParts[0] === 'groups' && $pathParts[1] === 'join' && $method === 'POST') {
        $data = getBody();
        // Accept invite code from URL param OR request body
        $code = strtoupper($pathParts[2] ?? trim($data['invite_code'] ?? ''));
        if (!$code) sendError('Invite code required');
        $sessionId = $data['session_id'] ?? session_id() ?: 'anon-' . bin2hex(random_bytes(4));
        $stmt = $pdo->prepare("SELECT id, name, invite_code FROM study_groups WHERE invite_code = ?");
        $stmt->execute([$code]);
        $group = $stmt->fetch();
        if (!$group) sendError('Invalid invite code', 404);
        $pdo->prepare("INSERT INTO study_group_members (group_id, user_session_id) VALUES (?, ?) ON CONFLICT DO NOTHING")->execute([$group['id'], $sessionId]);
        sendJson(['group_id' => $group['id'], 'group_name' => $group['name'], 'invite_code' => $group['invite_code'], 'success' => true]);
    }

    if ($pathParts[0] === 'groups' && isset($pathParts[1]) && isset($pathParts[2]) && $pathParts[2] === 'leaderboard' && $method === 'GET') {
        $groupId = (int)$pathParts[1];
        $grpStmt = $pdo->prepare("SELECT id, name, invite_code, created_at FROM study_groups WHERE id = ?");
        $grpStmt->execute([$groupId]);
        $group = $grpStmt->fetch();
        if (!$group) sendError('Group not found', 404);
        $stmt = $pdo->prepare("SELECT user_session_id, points, joined_at FROM study_group_members WHERE group_id = ? ORDER BY points DESC LIMIT 50");
        $stmt->execute([$groupId]);
        $members = $stmt->fetchAll();
        sendJson(['group' => $group, 'members' => $members]);
    }

    // ─── Admin: New Auth Routes ────────────────────────────────────────────────

    $authCtrl = new AuthController($pdo);
    if ($path === 'auth/register'        && $method === 'POST') { $authCtrl->register(); }
    if ($path === 'auth/login'           && $method === 'POST') { $authCtrl->login(); }
    if ($path === 'auth/logout'          && $method === 'POST') { $authCtrl->logout(); }
    if ($path === 'auth/me'              && $method === 'GET')  { $authCtrl->me(); }
    if ($path === 'auth/change-password' && $method === 'POST') { $authCtrl->changePassword(); }

    // ─── Admin: User (Intern) Management ─────────────────────────────────────

    $userCtrl = new UserController($pdo);
    if ($path === 'admin/users' && $method === 'GET')  { $userCtrl->index(); }
    if ($path === 'admin/users' && $method === 'POST') { $userCtrl->create(); }

    if ($pathParts[0] === 'admin' && $pathParts[1] === 'users' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $uid = (int)$pathParts[2];

        // GET /admin/users/:id/permissions
        if (isset($pathParts[3]) && $pathParts[3] === 'permissions') {
            $permCtrl = new PermissionController($pdo);
            if ($method === 'GET') { $permCtrl->show($uid); }
            if ($method === 'PUT') { $permCtrl->update($uid); }
        }

        // GET /admin/users/:id/activity
        if (isset($pathParts[3]) && $pathParts[3] === 'activity') {
            $actCtrl = new ActivityLogController($pdo);
            if ($method === 'GET') { $actCtrl->byUser($uid); }
        }

        // PATCH/DELETE /admin/users/:id
        if (!isset($pathParts[3])) {
            if ($method === 'PATCH')  { $userCtrl->update($uid); }
            if ($method === 'DELETE') { $userCtrl->delete($uid); }
        }
    }

    // ─── Admin: Activity Logs ─────────────────────────────────────────────────

    $actCtrl = new ActivityLogController($pdo);
    if ($path === 'admin/activity-logs'        && $method === 'GET') { $actCtrl->index(); }
    if ($path === 'admin/activity-logs/stats'  && $method === 'GET') { $actCtrl->stats(); }

    // ─── Tutor System Migration (run once) ──────────────────────────────────────
    if ($path === 'tutor/migrate' && $method === 'POST') {
        requireAuth(['admin']);
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS tutor_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                bio TEXT,
                subjects TEXT,
                hourly_rate DECIMAL(10,2) DEFAULT 0,
                profile_approved BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tutor_courses (
                id SERIAL PRIMARY KEY,
                tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                price DECIMAL(10,2) DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tutor_enrollments (
                id SERIAL PRIMARY KEY,
                tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES tutor_courses(id) ON DELETE SET NULL,
                fee_paid BOOLEAN DEFAULT FALSE,
                payment_ref TEXT,
                payment_method TEXT DEFAULT 'jazzcash',
                payment_status TEXT DEFAULT 'pending',
                enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tutor_id, student_id, course_id)
            );

            CREATE TABLE IF NOT EXISTS tutor_videos (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES tutor_courses(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                youtube_url TEXT NOT NULL,
                description TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tutor_readings (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES tutor_courses(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                content TEXT,
                file_url TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tutor_classes (
                id SERIAL PRIMARY KEY,
                tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES tutor_courses(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                description TEXT,
                platform TEXT DEFAULT 'zoom',
                meeting_link TEXT NOT NULL,
                scheduled_at TIMESTAMPTZ NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS tutor_announcements (
                id SERIAL PRIMARY KEY,
                tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES tutor_courses(id) ON DELETE SET NULL,
                title TEXT NOT NULL,
                body TEXT,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS student_last_online (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                last_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        ");
        // ensure tutor role allowed in users table
        try {
            $pdo->exec("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
            $pdo->exec("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','intern','student','tutor'))");
        } catch (Exception $e) { /* ignore if already updated */ }
        sendJson(['ok' => true, 'message' => 'Tutor tables created']);
    }

    // ─── Update last_online on any authenticated request ─────────────────────
    // (called by client on load)
    if ($path === 'student/ping' && $method === 'POST') {
        $user = requireAuth(['student']);
        $pdo->prepare("
            INSERT INTO student_last_online(user_id, last_seen) VALUES(?,NOW())
            ON CONFLICT(user_id) DO UPDATE SET last_seen=NOW()
        ")->execute([$user['id']]);
        sendJson(['ok' => true]);
    }

    // ─── Tutor: Self-registration ─────────────────────────────────────────────
    if ($path === 'tutor/register' && $method === 'POST') {
        $body = getBody();
        $email = trim($body['email'] ?? '');
        $password = trim($body['password'] ?? '');
        $username = trim($body['username'] ?? '');
        $bio = trim($body['bio'] ?? '');
        $subjects = trim($body['subjects'] ?? '');
        if (!$email || !$password || !$username) sendError('email, password, and username are required');
        $check = $pdo->prepare('SELECT id FROM users WHERE email=?');
        $check->execute([$email]);
        if ($check->fetch()) sendError('Email already registered', 409);
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $ins = $pdo->prepare("INSERT INTO users(username,email,password_hash,role,must_change_password,created_at) VALUES(?,?,?,'tutor',false,NOW()) RETURNING id");
        $ins->execute([$username, $email, $hash]);
        $uid = $ins->fetch()['id'];
        // create profile
        $pdo->prepare("INSERT INTO tutor_profiles(user_id,bio,subjects) VALUES(?,?,?)")->execute([$uid,$bio,$subjects]);
        // create session
        $token = bin2hex(random_bytes(32));
        $exp = date('Y-m-d H:i:s', strtotime('+7 days'));
        $pdo->prepare("INSERT INTO sessions(user_id,token,expires_at) VALUES(?,?,?)")->execute([$uid,$token,$exp]);
        sendJson(['token'=>$token,'user'=>['id'=>$uid,'username'=>$username,'email'=>$email,'role'=>'tutor','must_change_password'=>false,'permissions'=>[]]], 201);
    }

    // ─── Tutor: Dashboard ────────────────────────────────────────────────────
    if ($path === 'tutor/dashboard' && $method === 'GET') {
        $user = requireAuth(['tutor','admin']);
        $tid = $user['id'];
        $students = $pdo->prepare("SELECT COUNT(DISTINCT student_id) as cnt FROM tutor_enrollments WHERE tutor_id=?");
        $students->execute([$tid]); $sc = $students->fetch()['cnt'];
        $courses = $pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_courses WHERE tutor_id=?");
        $courses->execute([$tid]); $cc = $courses->fetch()['cnt'];
        $videos = $pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_videos v JOIN tutor_courses c ON v.course_id=c.id WHERE c.tutor_id=?");
        $videos->execute([$tid]); $vc = $videos->fetch()['cnt'];
        $classes = $pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_classes WHERE tutor_id=? AND scheduled_at > NOW()");
        $classes->execute([$tid]); $lcc = $classes->fetch()['cnt'];
        $paid = $pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_enrollments WHERE tutor_id=? AND fee_paid=true");
        $paid->execute([$tid]); $pc = $paid->fetch()['cnt'];
        $unpaid = $pdo->prepare("SELECT COUNT(*) as cnt FROM tutor_enrollments WHERE tutor_id=? AND fee_paid=false");
        $unpaid->execute([$tid]); $upc = $unpaid->fetch()['cnt'];
        sendJson(['students'=>$sc,'courses'=>$cc,'videos'=>$vc,'upcoming_classes'=>$lcc,'paid'=>$pc,'unpaid'=>$upc]);
    }

    // ─── Tutor: Profile ──────────────────────────────────────────────────────
    if ($path === 'tutor/profile' && $method === 'GET') {
        $user = requireAuth(['tutor']);
        $stmt = $pdo->prepare("SELECT tp.*, u.username, u.email FROM tutor_profiles tp JOIN users u ON u.id=tp.user_id WHERE tp.user_id=?");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetch() ?: []);
    }
    if ($path === 'tutor/profile' && $method === 'PUT') {
        $user = requireAuth(['tutor']);
        $b = getBody();
        $pdo->prepare("UPDATE tutor_profiles SET bio=?,subjects=?,hourly_rate=? WHERE user_id=?")->execute([$b['bio']??'',$b['subjects']??'',$b['hourly_rate']??0,$user['id']]);
        sendJson(['ok'=>true]);
    }

    // ─── Tutor: Courses ──────────────────────────────────────────────────────
    if ($path === 'tutor/courses' && $method === 'GET') {
        $user = requireAuth(['tutor','admin']);
        $stmt = $pdo->prepare("SELECT tc.*, (SELECT COUNT(*) FROM tutor_videos v WHERE v.course_id=tc.id) as video_count, (SELECT COUNT(*) FROM tutor_enrollments e WHERE e.course_id=tc.id) as student_count FROM tutor_courses tc WHERE tc.tutor_id=? ORDER BY tc.created_at DESC");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }
    if ($path === 'tutor/courses' && $method === 'POST') {
        $user = requireAuth(['tutor']);
        $b = getBody();
        if (empty($b['title'])) sendError('title is required');
        $stmt = $pdo->prepare("INSERT INTO tutor_courses(tutor_id,title,description,price) VALUES(?,?,?,?) RETURNING *");
        $stmt->execute([$user['id'],$b['title'],$b['description']??'',$b['price']??0]);
        sendJson($stmt->fetch(), 201);
    }
    if ($pathParts[0]==='tutor' && $pathParts[1]==='courses' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $cid = (int)$pathParts[2];
        if ($method === 'PUT') {
            $user = requireAuth(['tutor']);
            $b = getBody();
            $pdo->prepare("UPDATE tutor_courses SET title=?,description=?,price=? WHERE id=? AND tutor_id=?")->execute([$b['title'],$b['description']??'',$b['price']??0,$cid,$user['id']]);
            sendJson(['ok'=>true]);
        }
        if ($method === 'DELETE') {
            $user = requireAuth(['tutor']);
            $pdo->prepare("DELETE FROM tutor_courses WHERE id=? AND tutor_id=?")->execute([$cid,$user['id']]);
            sendJson(['ok'=>true]);
        }
        // GET /tutor/courses/:id/videos
        if ($method === 'GET' && isset($pathParts[3]) && $pathParts[3]==='videos') {
            requireAuth(['tutor','admin','student']);
            $stmt = $pdo->prepare("SELECT * FROM tutor_videos WHERE course_id=? ORDER BY created_at DESC");
            $stmt->execute([$cid]); sendJson($stmt->fetchAll());
        }
        // POST /tutor/courses/:id/videos
        if ($method === 'POST' && isset($pathParts[3]) && $pathParts[3]==='videos') {
            $user = requireAuth(['tutor']);
            $b = getBody();
            $stmt = $pdo->prepare("INSERT INTO tutor_videos(course_id,title,youtube_url,description) VALUES(?,?,?,?) RETURNING *");
            $stmt->execute([$cid,$b['title'],$b['youtube_url'],$b['description']??'']);
            sendJson($stmt->fetch(),201);
        }
        // GET /tutor/courses/:id/readings
        if ($method === 'GET' && isset($pathParts[3]) && $pathParts[3]==='readings') {
            requireAuth(['tutor','admin','student']);
            $stmt = $pdo->prepare("SELECT * FROM tutor_readings WHERE course_id=? ORDER BY created_at DESC");
            $stmt->execute([$cid]); sendJson($stmt->fetchAll());
        }
        // POST /tutor/courses/:id/readings
        if ($method === 'POST' && isset($pathParts[3]) && $pathParts[3]==='readings') {
            $user = requireAuth(['tutor']);
            $b = getBody();
            $stmt = $pdo->prepare("INSERT INTO tutor_readings(course_id,title,content,file_url) VALUES(?,?,?,?) RETURNING *");
            $stmt->execute([$cid,$b['title'],$b['content']??'',$b['file_url']??'']);
            sendJson($stmt->fetch(),201);
        }
    }

    // ─── Tutor: Students ─────────────────────────────────────────────────────
    if ($path === 'tutor/students' && $method === 'GET') {
        $user = requireAuth(['tutor']);
        $stmt = $pdo->prepare("
            SELECT DISTINCT u.id, u.username, u.email,
                slo.last_seen,
                (SELECT COUNT(*) FROM tutor_enrollments e2 WHERE e2.student_id=u.id AND e2.tutor_id=? AND e2.fee_paid=true) as paid_courses,
                (SELECT COUNT(*) FROM tutor_enrollments e3 WHERE e3.student_id=u.id AND e3.tutor_id=?) as total_courses
            FROM tutor_enrollments e
            JOIN users u ON u.id=e.student_id
            LEFT JOIN student_last_online slo ON slo.user_id=u.id
            WHERE e.tutor_id=?
            ORDER BY slo.last_seen DESC NULLS LAST
        ");
        $stmt->execute([$user['id'],$user['id'],$user['id']]);
        sendJson($stmt->fetchAll());
    }

    // GET /tutor/students/:id/enrollments - enrollments of a specific student with this tutor
    if ($pathParts[0]==='tutor' && $pathParts[1]==='students' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $sid = (int)$pathParts[2];
        if ($method === 'GET' && isset($pathParts[3]) && $pathParts[3]==='enrollments') {
            $user = requireAuth(['tutor']);
            $stmt = $pdo->prepare("SELECT e.*, tc.title as course_title, tc.price FROM tutor_enrollments e JOIN tutor_courses tc ON tc.id=e.course_id WHERE e.tutor_id=? AND e.student_id=?");
            $stmt->execute([$user['id'],$sid]);
            sendJson($stmt->fetchAll());
        }
    }

    // ─── Tutor: Enrollments ──────────────────────────────────────────────────
    if ($path === 'tutor/enrollments' && $method === 'POST') {
        $user = requireAuth(['tutor']);
        $b = getBody();
        $stmt = $pdo->prepare("INSERT INTO tutor_enrollments(tutor_id,student_id,course_id) VALUES(?,?,?) ON CONFLICT DO NOTHING RETURNING *");
        $stmt->execute([$user['id'],$b['student_id'],$b['course_id']]);
        sendJson($stmt->fetch() ?: ['ok'=>true], 201);
    }
    if ($pathParts[0]==='tutor' && $pathParts[1]==='enrollments' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $eid = (int)$pathParts[2];
        // PUT /tutor/enrollments/:id/fee
        if ($method === 'PUT' && isset($pathParts[3]) && $pathParts[3]==='fee') {
            $user = requireAuth(['tutor']);
            $b = getBody();
            $pdo->prepare("UPDATE tutor_enrollments SET fee_paid=?,payment_status=? WHERE id=? AND tutor_id=?")->execute([$b['fee_paid']?'true':'false',$b['fee_paid']?'confirmed':'pending',$eid,$user['id']]);
            sendJson(['ok'=>true]);
        }
        if ($method === 'DELETE') {
            $user = requireAuth(['tutor']);
            $pdo->prepare("DELETE FROM tutor_enrollments WHERE id=? AND tutor_id=?")->execute([$eid,$user['id']]);
            sendJson(['ok'=>true]);
        }
    }

    // ─── Tutor: Payment Requests (students submit payment proof) ─────────────
    if ($path === 'tutor/payments' && $method === 'GET') {
        $user = requireAuth(['tutor']);
        $stmt = $pdo->prepare("SELECT e.*, u.username, u.email, tc.title as course_title FROM tutor_enrollments e JOIN users u ON u.id=e.student_id JOIN tutor_courses tc ON tc.id=e.course_id WHERE e.tutor_id=? AND e.payment_ref IS NOT NULL ORDER BY e.enrolled_at DESC");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }

    // Student submits payment reference
    if ($path === 'student/payment' && $method === 'POST') {
        $user = requireAuth(['student']);
        $b = getBody();
        $pdo->prepare("UPDATE tutor_enrollments SET payment_ref=?,payment_method=?,payment_status='submitted' WHERE id=? AND student_id=?")->execute([$b['payment_ref'],$b['payment_method']??'jazzcash',$b['enrollment_id'],$user['id']]);
        sendJson(['ok'=>true]);
    }

    // ─── Tutor: Live Classes ──────────────────────────────────────────────────
    if ($path === 'tutor/classes' && $method === 'GET') {
        $user = requireAuth(['tutor']);
        $stmt = $pdo->prepare("SELECT lc.*, tc.title as course_title FROM tutor_classes lc LEFT JOIN tutor_courses tc ON tc.id=lc.course_id WHERE lc.tutor_id=? ORDER BY lc.scheduled_at ASC");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }
    if ($path === 'tutor/classes' && $method === 'POST') {
        $user = requireAuth(['tutor']);
        $b = getBody();
        if (empty($b['title']) || empty($b['meeting_link']) || empty($b['scheduled_at'])) sendError('title, meeting_link, scheduled_at required');
        $stmt = $pdo->prepare("INSERT INTO tutor_classes(tutor_id,course_id,title,description,platform,meeting_link,scheduled_at,duration_minutes) VALUES(?,?,?,?,?,?,?,?) RETURNING *");
        $stmt->execute([$user['id'],$b['course_id']??null,$b['title'],$b['description']??'',$b['platform']??'zoom',$b['meeting_link'],$b['scheduled_at'],$b['duration_minutes']??60]);
        sendJson($stmt->fetch(), 201);
    }
    if ($pathParts[0]==='tutor' && $pathParts[1]==='classes' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $lid = (int)$pathParts[2];
        if ($method === 'PUT') {
            $user = requireAuth(['tutor']);
            $b = getBody();
            $pdo->prepare("UPDATE tutor_classes SET title=?,description=?,platform=?,meeting_link=?,scheduled_at=?,duration_minutes=? WHERE id=? AND tutor_id=?")->execute([$b['title'],$b['description']??'',$b['platform']??'zoom',$b['meeting_link'],$b['scheduled_at'],$b['duration_minutes']??60,$lid,$user['id']]);
            sendJson(['ok'=>true]);
        }
        if ($method === 'DELETE') {
            $user = requireAuth(['tutor']);
            $pdo->prepare("DELETE FROM tutor_classes WHERE id=? AND tutor_id=?")->execute([$lid,$user['id']]);
            sendJson(['ok'=>true]);
        }
    }

    // ─── Tutor: Announcements ────────────────────────────────────────────────
    if ($path === 'tutor/announcements' && $method === 'GET') {
        $user = requireAuth(['tutor']);
        $stmt = $pdo->prepare("SELECT a.*, tc.title as course_title FROM tutor_announcements a LEFT JOIN tutor_courses tc ON tc.id=a.course_id WHERE a.tutor_id=? ORDER BY a.created_at DESC");
        $stmt->execute([$user['id']]);
        sendJson($stmt->fetchAll());
    }
    if ($path === 'tutor/announcements' && $method === 'POST') {
        $user = requireAuth(['tutor']);
        $b = getBody();
        if (empty($b['title'])) sendError('title required');
        $stmt = $pdo->prepare("INSERT INTO tutor_announcements(tutor_id,course_id,title,body) VALUES(?,?,?,?) RETURNING *");
        $stmt->execute([$user['id'],$b['course_id']??null,$b['title'],$b['body']??'']);
        sendJson($stmt->fetch(), 201);
    }
    if ($pathParts[0]==='tutor' && $pathParts[1]==='announcements' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        if ($method === 'DELETE') {
            $user = requireAuth(['tutor']);
            $pdo->prepare("DELETE FROM tutor_announcements WHERE id=? AND tutor_id=?")->execute([(int)$pathParts[2],$user['id']]);
            sendJson(['ok'=>true]);
        }
    }

    // ─── Tutor: Videos management ─────────────────────────────────────────────
    if ($pathParts[0]==='tutor' && $pathParts[1]==='videos' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
        $vid = (int)$pathParts[2];
        if ($method === 'DELETE') {
            $user = requireAuth(['tutor']);
            $pdo->prepare("DELETE FROM tutor_videos v USING tutor_courses c WHERE v.id=? AND v.course_id=c.id AND c.tutor_id=?")->execute([$vid,$user['id']]);
            sendJson(['ok'=>true]);
        }
    }

    // ─── Student: My Tutor Data ──────────────────────────────────────────────
    if ($path === 'student/my-tutors' && $method === 'GET') {
        $user = requireAuth(['student']);
        $stmt = $pdo->prepare("
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

    if ($path === 'student/courses' && $method === 'GET') {
        $user = requireAuth(['student']);
        $stmt = $pdo->prepare("
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

    if ($path === 'student/available-courses' && $method === 'GET') {
        $user = requireAuth(['student']);
        $stmt = $pdo->prepare("
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

    if ($path === 'student/enroll' && $method === 'POST') {
        $user = requireAuth(['student']);
        $b = getBody();
        $course_id = $b['course_id'];
        
        $stmt = $pdo->prepare("SELECT tutor_id FROM tutor_courses WHERE id=?");
        $stmt->execute([$course_id]);
        $course = $stmt->fetch();
        if (!$course) {
            sendError('Course not found', 404);
        }
        
        try {
            $pdo->prepare("INSERT INTO tutor_enrollments (tutor_id, student_id, course_id, payment_status, fee_paid) VALUES (?, ?, ?, 'pending', false)")
                ->execute([$course['tutor_id'], $user['id'], $course_id]);
            sendJson(['ok'=>true, 'id'=>$pdo->lastInsertId()]);
        } catch (Exception $e) {
            sendError('Already enrolled or error', 400);
        }
    }

    if ($path === 'student/classes' && $method === 'GET') {
        $user = requireAuth(['student']);
        $stmt = $pdo->prepare("
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

    if ($path === 'student/announcements' && $method === 'GET') {
        $user = requireAuth(['student']);
        $stmt = $pdo->prepare("
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

    // ─── Admin: list all tutors ──────────────────────────────────────────────
    if ($path === 'admin/tutors' && $method === 'GET') {
        requireAuth(['admin']);
        $stmt = $pdo->query("SELECT u.id, u.username, u.email, tp.bio, tp.subjects, tp.hourly_rate, tp.profile_approved, (SELECT COUNT(*) FROM tutor_enrollments e WHERE e.tutor_id=u.id) as student_count FROM users u LEFT JOIN tutor_profiles tp ON tp.user_id=u.id WHERE u.role='tutor' ORDER BY u.created_at DESC");
        sendJson($stmt->fetchAll());
    }

    sendError("API route not found", 404);
} catch (Exception $e) {
    error_log($e->getMessage());
    sendError($e->getMessage(), 500);
}

