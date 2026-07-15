<?php

class ResourceController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    // GET /api/categories
    public function getCategories() {
        $stmt = $this->pdo->query('SELECT * FROM categories ORDER BY id ASC');
        sendJson($stmt->fetchAll());
    }

    // GET /api/subjects
    public function getSubjects() {
        $categoryId = $_GET['categoryId'] ?? null;
        if ($categoryId) {
            $stmt = $this->pdo->prepare('SELECT * FROM subjects WHERE category_id = ? ORDER BY name ASC');
            $stmt->execute([$categoryId]);
        } else {
            $stmt = $this->pdo->query('SELECT * FROM subjects ORDER BY name ASC');
        }
        sendJson($stmt->fetchAll());
    }

    // GET /api/resources
    public function getResources() {
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
        $countStmt = $this->pdo->prepare($countQuery);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];

        $query .= " ORDER BY r.created_at DESC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;

        $stmt = $this->pdo->prepare($query);
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

    // GET /api/resources/{id}
    public function getResource($params) {
        $id = $params['id'];
        $stmt = $this->pdo->prepare("
          SELECT r.*, c.name as category_name, s.name as subject_name 
          FROM resources r
          JOIN categories c ON r.category_id = c.id
          JOIN subjects s ON r.subject_id = s.id
          WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $resource = $stmt->fetch();
        if (!$resource) sendError('Resource not found', 404);

        $stmtTags = $this->pdo->prepare("
          SELECT t.* FROM tags t
          JOIN resource_tags rt ON t.id = rt.tag_id
          WHERE rt.resource_id = ?
        ");
        $stmtTags->execute([$id]);
        $resource['tags'] = $stmtTags->fetchAll();
        sendJson($resource);
    }
}
