<?php
// api/services/TaggingService.php

class TaggingService {
    private PDO $pdo;
    private string $apiKey;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
        $key = getenv('GEMINI_API_KEY');
        if (!$key) {
            throw new Exception("GEMINI_API_KEY is not set on the server.");
        }
        $this->apiKey = $key;
    }

    public function tagResource(int $id): array {
        // Fetch resource
        $stmt = $this->pdo->prepare("
            SELECT r.title, r.description, r.type, c.name as category, s.name as subject 
            FROM resources r
            JOIN categories c ON r.category_id = c.id
            JOIN subjects s ON r.subject_id = s.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $resource = $stmt->fetch();

        if (!$resource) {
            throw new Exception("Resource not found");
        }

        $textContext = "Title: {$resource['title']}\nDescription: {$resource['description']}\nType: {$resource['type']}\nCategory: {$resource['category']}\nSubject: {$resource['subject']}";

        // Step 1: Generate Topics and Difficulty
        $tagPrompt = "Analyze the following study resource and extract key topics and its difficulty level. Return ONLY a valid JSON object matching exactly this structure: {\"topics\": [\"array\", \"of\", \"strings\"], \"difficulty\": \"easy|medium|hard\"}\n\n" . $textContext;

        $tagPayload = [
            "contents" => [
                ["parts" => [["text" => $tagPrompt]]]
            ]
        ];

        $tagResponse = $this->callGemini("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent", $tagPayload);
        $tagText = $tagResponse['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
        
        // Strip markdown backticks if Gemini includes them
        $tagText = preg_replace('/```json\s*/', '', $tagText);
        $tagText = preg_replace('/```\s*/', '', $tagText);
        
        $tagData = json_decode($tagText, true);
        $topics = $tagData['topics'] ?? [];
        $difficulty = $tagData['difficulty'] ?? 'medium';

        // Convert PHP array to Postgres array string format
        // Example: {"Algebra", "Calculus"}
        $pgArray = '{' . implode(',', array_map(function($t) {
            return '"' . str_replace('"', '""', $t) . '"';
        }, $topics)) . '}';

        // Step 2: Generate Vector Embedding
        // We use text-embedding-004 model for embeddings
        $embedPayload = [
            "model" => "models/text-embedding-004",
            "content" => [
                "parts" => [["text" => $textContext]]
            ]
        ];

        $embedResponse = $this->callGemini("https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent", $embedPayload);
        $embeddingVector = $embedResponse['embedding']['values'] ?? [];

        if (empty($embeddingVector)) {
            throw new Exception("Failed to generate embedding vector");
        }

        // Convert array to Postgres vector string format: [0.1, 0.2, ...]
        $vectorString = '[' . implode(',', $embeddingVector) . ']';

        // Step 3: Update Database
        $updateStmt = $this->pdo->prepare("
            UPDATE resources 
            SET topic_tags = ?, difficulty_level = ?, embedding = ?
            WHERE id = ?
        ");
        $updateStmt->execute([$pgArray, $difficulty, $vectorString, $id]);

        return [
            'success' => true,
            'topics' => $topics,
            'difficulty' => $difficulty,
            'embedding_size' => count($embeddingVector)
        ];
    }

    private function callGemini(string $url, array $payload): array {
        $ch = curl_init($url . "?key=" . $this->apiKey);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $json = json_decode($response, true);
        
        if ($httpCode >= 400 || !is_array($json)) {
            throw new Exception("Gemini API error: " . ($json['error']['message'] ?? $response));
        }

        return $json;
    }
}
